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

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 화면 초기화시 공장, 저장위치 콤보박스 조회
        PlantReq();
        LogiReq();
        OtProcCdReq();
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
            clear();
        })

        // 사외창고 변경 시 스캔으로 포커스
        $("#selLOGI").on('change', function() {
            clear();
        })

        // 사외창고 변경 시 스캔으로 포커스
        $("#selOT_PROC").on('change', function() {
            clear();
        })

        $("#btnCncl").on("click", function() {
            popupManager.alert($("#selOT_PROC option:selected").text()+"\r\n"+$("[data-lng='MSG.0000000756']").text(), { // 세척 취소를 하시겠습니까?
            title: $("[data-lng='MSG.0000000004']").text(), // 알림
            buttons: ["OK", $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    Cancel();
                }
            });
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

    // 세척설비 콤보박스 정보 조회
    var OtProcCdReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtProcCd.do',
            data: {
                'LANG': getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selOT_PROC").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000637']").text(), {showtime:"LONG"}); // 세척설비 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                    $("#selOT_PROC").append(tag);
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
        if($("#selOT_PROC").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000638']").text(), {showtime:"LONG"}); // 세척설비를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            popupManager.alert($("#selOT_PROC option:selected").text(), {
            title: $("[data-lng='MSG.0000000004']").text(), // 알림
            buttons: ["OK", $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    CaseNoScan(inputScan);
                }
            });
        }
    }

    // 스캔 시 부품식별표 조회
    var CaseNoScan = function(inputScan) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_120_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'PROC_CD':$("#selOT_PROC").val(),
                'CASE_NO':inputScan,
                'LOGI_CD':$("#selLOGI").val(),
                'event':'ANS입고 (세척장) 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000639']").text(), {showtime:"LONG"}); // 존재하지 않는 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.GOOD_QTY < 1){
                    popupManager.instance($("[data-lng='MSG.0000000641']").text(), {showtime:"LONG"}); // 사용할 수 없는 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.WORK_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000640']").text(), {showtime:"LONG"}); // 이미 투입된 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DIFF_PART_FLAG == 'Y'){
                    popupManager.instance($("[data-lng='MSG.0000000735']").text(), {showtime:"LONG"}); // 세척중인 다른 품번이 존재합니다
                    $("#inputScan").focus();
                    return;
                }

                clear();
                $("#txtPART_CD").val(rowData.PART_CD);
                $("#txtCASE_NO").val(rowData.CASE_NO);
                $("#txtGOOD_QTY").val(rowData.GOOD_QTY);
                save(inputScan);

            }
        });
    }

    // 저장 처리
    var save = function(inputScan) {
        var C1_LIST = [];

        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PROC_CD":$("#selOT_PROC").val(), "CASE_NO":$("#txtCASE_NO").val(), "BAR_NO":inputScan, "LOGI_CD":$("#selLOGI").val(), "USER_ID":getUSER_ID, "RTN_MSG":""});

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_120_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.resultDT == ""){
                    popupManager.instance($("[data-lng='MSG.0000000322']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    $("#txtWORK_TM").val("");
                    return;
                }

                $("#txtWORK_TM").val(receivedData.resultDT);
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                $("#txtWORK_TM").val("");
            }
        });
    }

    var Cancel = function() {
        var C2_LIST = [];

        C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PROC_CD":$("#selOT_PROC").val(), "LOGI_CD":$("#selLOGI").val(), "USER_ID":getUSER_ID, "RTN_MSG":""});

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_120_C2.do',
            data: {
                'param1': C2_LIST
            },
            success: function(receivedData, setting) {
                popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장에 성공하였습니다
                clear();
                return;
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        $("#txtPART_CD").val("");
        $("#txtCASE_NO").val("");
        $("#txtGOOD_QTY").val("");
        $("#txtWORK_TM").val("");
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