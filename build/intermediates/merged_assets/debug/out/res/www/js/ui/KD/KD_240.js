/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');
    var saveflag = false;
    var C1_LIST = [];
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
        LogiReq();
        RetNoComboReq();
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
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 사외창고 변경 시 스캔 포커스
        $("#selLOGI").on('change', function() {
            $("#inputScan").focus();
        })

        // 반입번호 변경 시
        $("#selRET_NO").on('change', function() {
            clear();
            RetNoScan();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
            RetNoScan();
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
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
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

    // 플랜트 콤보박스 정보 조회
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

    // 플랜트 콤보박스 정보 조회
    var RetNoComboReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_240_S1.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'event':'반입 정보 조회'
            },
            success: function(receivedData, setting) {
                $("#selRET_NO").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000677']").text(), {showtime:"LONG"}); // 반입번호 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.RET_NO + "'>" + rowData.RET_NO + "</option>";
                    });
                    $("#selRET_NO").append(tag);
                    RetNoScan();
                }
            }
        });
    };

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        if(inputScan.length > 0) {
            TmScan(inputScan);
        }
    }

    // 반입 정보 조회 함수
    var RetNoScan = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_240_S2.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'RET_NO':$("#selRET_NO").val(),
                'event':'반입 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000677']").text(), {showtime:"LONG"}); // 반입번호 조회정보가 없습니다
                    $("#inputScan").focus();
                    return;
                }

                $("#list_kd_240_head").removeClass("blind");

                var template = $("#ListTemplate").html();
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{RET_QTY\}\}/, rowData.RET_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, 0);
                    Tot_Deli_Qty += parseInt(rowData.RET_QTY);
                });
                $("#list_kd_240").append(tag);
                $("#inputScan").focus();
            }
        });
    };

    // Tm 조회 함수
    var TmScan = function(tm_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwTm.do',
            data: {
                'PLANT_CD':$("#selPLANT").val(),
                'TM_NO':tm_no,
                'event':'Tm 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000432']").text(), {showtime:"LONG"}); // TM_NO가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.USE_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000679']").text(), {showtime:"LONG"}); // 출하 처리되지 않은 TM입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.VENDOR_CD != $("#selLOGI").val()){
                    popupManager.instance($("[data-lng='MSG.0000000671']").text(), {showtime:"LONG"}); // 사외창고가 다릅니다
                    $("#inputScan").focus();
                    return;
                }
                var exists = false;

                // TM 중복 스캔 방지
                $.each(C1_LIST,function(key,value){
                      $.each(value,function(key,value){
                            if(value == tm_no){
                                exists = true;
                            }
                      });
                 });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000450']").text(), {showtime:"LONG"}); // 이미 스캔한 TM입니다
                    $("#inputScan").focus();
                    return;
                }



                var part_yn = false;
                $("#list_kd_240 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + 1);

                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".RET_QTY").text())){
                            over_chk = true;
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".RET_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }
                        Tot_Scan_Qty += 1;
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                            over_chk = true;
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        $(this).prependTo('div .list_kd_240:eq(1)');
                        part_yn = true;

                        // 스캔 후 플랜트, 저장위치,  사외창고 선택 불가
                        $("#selPLANT").attr("disabled",true);
                        $("#selLOCTP").attr("disabled",true);
                        $("#selLOGI").attr("disabled",true);

                        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "RET_NO":$("#selRET_NO").val(), "TM_NO":tm_no,  "USER_ID":getUSER_ID, "RTN_MSG":""});
                    }
                });

                if(!part_yn){
                    popupManager.instance($("[data-lng='MSG.0000000543']").text(), {showtime:"LONG"}); // 품번이 리스트에 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
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
        if(Tot_Deli_Qty != Tot_Scan_Qty || over_chk == true){
            popupManager.instance($("[data-lng='MSG.0000000630']").text(), {showtime:"LONG"}); // 문서의 지시수량과 스캔수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }

        save();
    }

    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_240_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                    RetNoComboReq();
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

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_240").html("");
        $("#list_kd_240_head").addClass("blind");

        C1_LIST.length = 0;
        Tot_Scan_Qty = 0;
        Tot_Deli_Qty = 0;
        over_chk = false;

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        saveflag = false;
        $("#inputScan").focus();
    }

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack
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
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});