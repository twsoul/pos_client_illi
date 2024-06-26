/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Box_No_List = [];
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
        $("#inputScan").focus();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    console.log("스캔됨");
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 반납창고 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq("10");
            StorageLocationReq2();
        })

        // 플랜트 변경 시 반납창고 콤보박스 신규 호출
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 플랜트 변경 시 반납창고 콤보박스 신규 호출
        $("#selFRLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
            setClearClickEvent();
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
                    StorageLocationReq("10");
                    StorageLocationReq2();
                }
            }
        });
    };

    // 반납창고 콤보박스 정보 조회
    var StorageLocationReq = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': [type]
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLOCTP").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                if($("#selPLANT").val() == getWERKS) {
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
            }
        });
        $("#inputScan").focus();
    }

    // 불출창고 콤보박스 정보 조회
    var StorageLocationReq2 = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': ["20","30"]
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selFRLOCTP").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selFRLOCTP").append(tag);
            }
        });
        $("#inputScan").focus();
    }

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000245']").text(), {showtime:"LONG"}); // 원창을 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔시 플랜트와 반납창고 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                var tag = "";
                var template = $("#ListTemplate").html();
                tag += template.replace(/\{\{PART_NO\}\}/, rowData.PART_CD)
                               .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{SCAN_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                               .replace(/\{\{LOC_TP_TYPE\}\}/, rowData.LOC_TP_TYPE)
                               .replace(/\{\{PRE_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{LB0000000038\}\}/, $("[data-lng='LB.0000000038']").text())  // 품번
                               .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())  // 부품식별표
                               .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text())  // 스캔수량
                               .replace(/\{\{LB0000000237\}\}/, $("[data-lng='LB.0000000237']").text())  // 반납수량
                               .replace(/\{\{LB0000000170\}\}/, $("[data-lng='LB.0000000170']").text()); // 예상수량
                $("#list_ot_060").prepend(tag);

                // 포커스 이동
                $("#list_ot_060 .tableCont").each(function() {
                    if($(this).find(".BOX_NO").text() == rowData.BOX_NO){
                        $(this).find(".MRG_QTY").click();
                    }
                });
            }
        });
    };

    // 저장 조건 처리
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userFrLocTpCheck = $("#selFRLOCTP").val();
        var save_Chk = true;

        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(userFrLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000246']").text(), {showtime:"LONG"}); // 현창을 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        // 리스트 정보 Box_No_List 배열에 추가
        $("#list_ot_060 .tableCont").each(function() {
            Box_No_List.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selFRLOCTP").val(), "TO_LOC_TP":$("#selLOCTP").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendcd"), "PART_CD":$(this).find(".PART_NO").text(), "RETURN_QTY":$(this).find(".MRG_QTY").val(), "EXP_QTY":$(this).find(".PRE_QTY").text(), "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
            if($(this).find(".MRG_QTY").val()<=0){ // 반납할 수량이 0이하일 경우
                save_Chk=false;
                $(this).find(".MRG_QTY").click();
            }
        });

        if(save_Chk){
            save();
        } else {
            popupManager.instance($("[data-lng='MSG.0000000282']").text(), {showtime:"LONG"}); // 최소 1개 이상 수량을 입력하십시오
            Box_No_List.length=0;
            return;
        }
    }

    // PR_PDA_OT_060_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_060_C1.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    clear();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("Save error");
                Box_No_List.length = 0;
                saveflag = false;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_ot_060").html("");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        $("#inpBoxQty").text("0");
        Box_No_List.length = 0;
        saveflag = false;
        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        var preQty = Number($(obj).parent().siblings(".SCAN_QTY").text())+Number($(obj).val());

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }

        $(obj).parent().siblings(".PRE_QTY").text(preQty);
    };

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;

        $("#list_ot_060 .tableCont").each(function() {
            if($(this).data("boxno") == box_no){
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
		moveToBack: moveToBack,
		inputEvent: inputEvent
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