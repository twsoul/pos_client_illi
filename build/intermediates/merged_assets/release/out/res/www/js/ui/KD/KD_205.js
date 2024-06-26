/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');
    var saveflag = false;
    var wh_cd = "";

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
        LogiReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 사외창고 변경 시 스캔으로 포커스
        $("#selLOGI").on('change', function() {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
        })
    };

    // 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PlantCodeList.do',
            data: {
                'LANG': getLNG,
                'WERKS': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["50"]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selLOCTP").html("");
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
        	}
        });
        $("#inputScan").focus();
    }

    // 사외창고 콤보박스 정보 조회
    var LogiReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtLogi.do',
            data: {
                'LANG': getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selLOGI").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000632']").text(), {showtime:"LONG"}); // 사외창고 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                    $("#selLOGI").append(tag);
                }
            }
        });
    };

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selLOCTP").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        if(inputScan.length > 0) {
            if($("#txtRACK").text()== ""){
                RackOrder(inputScan);
            } else {
                if(parseInt($("#txtMAX_QTY").text()) <= parseInt($("#txtMAPPED_QTY").text())){
                    popupManager.instance($("[data-lng='MSG.0000000782']").text(), {showtime:"LONG"}); // 랙 최대수량을 초과할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }else{
                    PalletScan(inputScan);
                }
            }
        }
    }

    // RACK 조회 함수
    var RackOrder = function(rack_bar) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwRackCode.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOC_TP':$("#selLOCTP").val(),
                'RACK_BAR':rack_bar,
                'event':'RACK 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000305']").text(), {showtime:"LONG"}); // RACK 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $("#selLOGI").attr("disabled",true);

                wh_cd = rowData.WH_CD;
                $("#txtRACK").text(rack_bar);
                $("#txtMAX_QTY").text(rowData.MAX_QTY);
                $("#txtMAPPED_QTY").text(rowData.MAP_QTY);

                $("#inputScan").focus();
            }
        });
    }

    // Pallet 조회 함수
    var PalletScan = function(plt_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwPallet.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'PLT_NO':plt_no,
                'event':'팔레트 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLT_LOC_CD != "B02"){
                    popupManager.instance($("[data-lng='MSG.0000000683']").text(), {showtime:"LONG"}); // 포장장 입고 팔레트가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.MAP_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000668']").text(), {showtime:"LONG"}); // 공팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.RETURN_FLAG == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000778']").text(), {showtime:"LONG"}); // 반품용 팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(wh_cd == "IN"){
                    if(rowData.PACK_FLAG != "N"){
                        popupManager.instance($("[data-lng='MSG.0000000779']").text(), {showtime:"LONG"}); // 포장처리된 팔레트입니다
                        $("#inputScan").focus();
                        return;
                    }
                } else {
                    if(rowData.PACK_FLAG != "Y"){
                        popupManager.instance($("[data-lng='MSG.0000000760']").text(), {showtime:"LONG"}); // 포장처리되지 않은 Pallet입니다
                        $("#inputScan").focus();
                        return;
                    }
                }

                var exists = false;

                // Pallet 중복 스캔 방지
                $("#list_kd_205 .tableCont").each(function() {
                    if($(this).find(".PLT_NO").text() == plt_no){
                        exists = true;
                    }
                });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000394']").text(), {showtime:"LONG"}); // 이미 스캔한 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }

                var template = $("#ListTemplate").html();
                var tag = "";

                tag += template.replace(/\{\{PLT_NO\}\}/, plt_no)
                               .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.MAP_QTY);
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                $("#txtMAPPED_QTY").text(parseInt($("#txtMAPPED_QTY").text())+1);
                $("#list_kd_205_head").removeClass("blind");
                $("#list_kd_205").prepend(tag);
                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        save();
    }

    var save = function() {
        var C1_LIST = [];
        saveflag = true;
        $("#list_kd_205 .tableCont").each(function() {
            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PLT_NO":$(this).find(".PLT_NO").text(), "LOGI_CD":$("#selLOGI").val(), "RACK_NO":$("#txtRACK").text(), "WH_CD":wh_cd, "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_205_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                saveflag = false;
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        $("#list_kd_205").html("");
        $("#txtRACK").text("");
        $("#txtMAX_QTY").text("");
        $("#txtMAPPED_QTY").text("");

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);
        $("#list_kd_205_head").addClass("blind");
        saveflag = false;
        $("#inpBoxQty").text("0");
        $("#inputScan").focus();
    }

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {

	};

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent
	};
})(window, document, $, M);

/*******************************************************************
*	MCore Common Events
*******************************************************************/
M.onReady(function(e) {
	page.setInitScreen();
	page.setInitEvent();
}).onHide(function(e){
	// 화면 이동 전에 호출
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});