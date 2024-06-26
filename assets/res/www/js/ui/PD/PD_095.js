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

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
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
            	'TYPE': ["90"]
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
            if($("#txtPALLET").text()== ""){
                PalletScan(inputScan);
            } else {
                if($("#txtPACK_QTY").text() == $("#inpBoxQty").text()){
                    popupManager.instance($("[data-lng='MSG.0000000659']").text(), {showtime:"LONG"}); // 팔레트의 수량을 초과할 수 없습니다
                    return;
                }
                TmScan(inputScan);
            }
        }
    }

    // 팔레트 정보 조회 함수
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
                if (rowData.PLT_LOC_CD != "A01") {
                    popupManager.instance($("[data-lng='MSG.0000000658']").text(), {showtime:"LONG"}); // 공팔레트가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 후 플랜트, 저장위치, 반출증/유무, 반출유형 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $("#txtPALLET").text(plt_no);
                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtPACK_QTY").text(rowData.PACK_QTY);

                $("#inputScan").focus();
            }
        });
    };

    // TM 조회 함수
    var TmScan = function(tm_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_095_S1.do',
            data: {
                'PLANT_CD':$("#selPLANT").val(),
                'TM_NO':tm_no,
                'event':'TM 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000432']").text(), {showtime:"LONG"}); // TM_NO가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PART_CD != $("#txtPART_CD").text() && $("#txtPART_CD").text() != "") {
                    popupManager.instance($("[data-lng='MSG.0000000371']").text(), {showtime:"LONG"}); // 품번 정보가 일치하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(IsNotExitList(tm_no)){
                    popupManager.instance($("[data-lng='MSG.0000000450']").text(), {showtime:"LONG"}); // 이미 스캔한 TM입니다
                    $("#inputScan").focus();
                    return;
                }

                if($("#txtPART_CD").text() == ""){
                    $("#txtPART_CD").text(rowData.PART_CD);
                }

                var template = $("#ListTemplate").html();
                var tag = "";

                tag += template.replace(/\{\{TM_NO\}\}/, tm_no)
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                $("#list_pd_095_head").removeClass("blind");
                $("#list_pd_095").prepend(tag);

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

    // PR_PDA_PD_095_C1 호출 및 저장
    var save = function() {
        var C1_LIST = [];
        var C2_LIST = [];
        saveflag = true;

        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PLT_NO":$("#txtPALLET").text(), "PART_CD":$("#txtPART_CD").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
        $("#list_pd_095 .tableCont").each(function() {
            C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "PLT_NO":$("#txtPALLET").text(), "TM_NO":$(this).find(".TM_NO").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_095_C1.do',
            data: {
                'param1': C1_LIST,
                'param2': C2_LIST
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

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_pd_095").html("");
        $("#list_pd_095_head").addClass("blind");
        $("#txtPALLET").text("");
        $("#txtPART_CD").text("");
        $("#txtPACK_QTY").text("");

        $("#inpBoxQty").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        saveflag = false;
        $("#inputScan").focus();
    }

    // TM이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(tm_no){
        var rtn = false;

        $("#list_pd_095 .tableCont").each(function() {
            if($(this).find(".TM_NO").text() == tm_no){
                rtn = true;
                return false; // each문의 break;
            }
        });

        return rtn;
    };

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