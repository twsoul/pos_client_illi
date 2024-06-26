/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var C1_LIST = [];

    var Tot_Scan_Qty = 0;
    var Tot_Case_Qty = 0;

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 화면 초기화시 공장, 저장위치 콤보박스 조회
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

        // 플랜트 변경 시 스캔으로 포커스
        $("#selPLANT").on('change', function() {
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
                }
            }
        });
    };

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

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selLOGI").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000633']").text(), {showtime:"LONG"}); // 사외창고를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 스캔 시 부품식별표 조회
    var BoxNoScan = function(inputScan) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_140_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOGI_CD':$("#selLOGI").val(),
                'BOX_BAR_NO':inputScan,
                'event':'출고처리 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000538']").text(), {showtime:"LONG"}); // 조회된 데이터가 없습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BAR_QTY < 1){
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.OUT_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000656']").text(), {showtime:"LONG"}); // 이미 출고된 BOX입니다
                    $("#inputScan").focus();
                    return;
                }
                var exists = false;

                // 부품식별표 중복 스캔 방지
                $.each(C1_LIST,function(key,value){
                    $.each(value,function(key,value){
                        if(value == rowData.BOX_NO){
                            exists = true;
                        }
                    });
                });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#selPLANT").attr("disabled",true);
                $("#selLOGI").attr("disabled",true);
                $("#list_kd_140_head").removeClass("blind");

                var template = $("#ListTemplate").html();
                var tag = "";
                var exist = false;

                C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOGI_CD":$("#selLOGI").val(), "BOX_NO":rowData.BOX_NO, "USER_ID":getUSER_ID, "RTN_MSG":""});

                $("#list_kd_140 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        exist = true;
                    }
               });
               if(!exist){
                   tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                  .replace(/\{\{BOX_QTY\}\}/, 1)
                                  .replace(/\{\{SCAN_QTY\}\}/, rowData.BAR_QTY)
                   $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                   $("#list_kd_140").append(tag);
               }
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

    // 저장 처리
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_140_C1.do',
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
        C1_LIST.length = 0;

        $("#list_kd_140").html("");
        $("#list_kd_140_head").addClass("blind");
        $("#inpBoxQty").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);
        saveflag = false;
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