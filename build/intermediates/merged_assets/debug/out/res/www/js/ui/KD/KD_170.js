/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT20 = optionManager.getLGORT20();
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

        // 플랜트 변경 시 저장위치 재조회
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
            StorageLocationReq2();
        })

        // 저장위치 변경 시 스캔으로 포커스
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 사외창고 변경 시 스캔으로 포커스
        $("#selTOLOCTP").on('change', function() {
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
                    StorageLocationReq2();
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeListKD.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val()
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
    var StorageLocationReq2 = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeListLP.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val()
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selTOLOCTP").html("");
                if(receivedData.ListCount != 0){
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                    });
                }
                $("#selTOLOCTP").append(tag);
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
        if($("#selLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selTOLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000633']").text(), {showtime:"LONG"}); // 사외창고를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if($("#txtORD_NO").text()==""){
                OrdNoScan(inputScan);
            }
        }
    }

    var OrdNoScan = function(ord_no) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_170_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'ORD_NO':ord_no,
                'event':'요청번호 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000625']").text(), {showtime:"LONG"}); // 존재하지 않는 문서번호 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.USE_FLAG == "N"){
                    popupManager.instance($("[data-lng='MSG.0000000739']").text(), {showtime:"LONG"}); // 사용할 수 없는 문서번호 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.OUT_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000737']").text(), {showtime:"LONG"}); // 이미 처리된 문서번호 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔시 플랜트와 원창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                $("#txtORD_NO").text(ord_no);

                $("#list_kd_170_head").removeClass("blind");
                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();
                    tag += template.replace(/\{\{CASE_NO\}\}/gi, rowData.CASE_NO)
                                   .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY);

                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                    $("#list_kd_170").prepend(tag);
                });

                $("#inputScan").focus();
            }
        });
    }

    // 저장 처리
    var setSaveClickEvent = function() {
        if(saveflag){ return; }

        if($("#txtORD_NO").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        save();
    }

    var save = function() {
        saveflag = true;
        var C1_LIST = [];

        $("#list_kd_170 .tableCont").each(function() {
            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "ORD_NO":$("#txtORD_NO").text(), "LOGI_CD":$("#selTOLOCTP").val(), "CASE_NO":$(this).find(".CASE_NO").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_170_C1.do',
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
        $("#list_kd_170").html("");
        $("#list_kd_170_head").addClass("blind");
        $("#txtORD_NO").text("");
        $("#inpBoxQty").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

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