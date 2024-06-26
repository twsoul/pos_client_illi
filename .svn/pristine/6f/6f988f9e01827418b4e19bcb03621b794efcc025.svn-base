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

    var C1_List = [];
    var C2_List = [];
    var pre_count = 0;
    var pre_insp_dttm = "";
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
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        })

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function () {
            StorageLocationReq("10");
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
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
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
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

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }

        if(inputScan.length > 0) {
            if($("#txtBOXNO").text() == ""){
                BoxNoScan(inputScan);
            } else {
                popupManager.instance($("[data-lng='MSG.0000000248']").text(), {showtime:"LONG"}); // 한개의 분할식별표만 가능합니다
                return;
            }
        }
    }

    // 부품식별표 정보 조회 함수
    var BoxNoScan = function(boxBarCode){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'LANG':getLNG,
                'event':'부품식별표 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var box_no_exists = false;
                var part_cd_exists = false;

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
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
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

                // 스캔 후 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                // 리스트 세팅
                $("#txtBOXNO").text(rowData.BOX_NO);
                $("#txtPARTNO").text(rowData.PART_CD);
                $("#txtQTY").text(rowData.BAR_QTY);
                $("#txtEXPQTY").text(rowData.BAR_QTY);

                pre_count = rowData.BAR_QTY;
                if(rowData.PRE_INSP_DTTM != null && rowData.PRE_INSP_DTTM != undefined && rowData.PRE_INSP_DTTM != "undefined"){
                    pre_insp_dttm = rowData.PRE_INSP_DTTM;
                }

                C1_List.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "VENDOR_CD":rowData.VENDOR_CD, "RTN_MSG":"", "RTN_BOX":""});
                C2_List.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "N_BOX_NO":"", "BOX_NO":rowData.BOX_NO ,"VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "EXP_QTY":"", "DIV_QTY":"", "PRE_INSP_DTTM":pre_insp_dttm, "INSP_FLAG":rowData.INSP_FLAG, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM,  "RTN_MSG":""});

                NewBoxNoInfo();
                $("#inputScan").focus();
            }
        });
    }

    // 신규 부품식별표 정보 조회 함수
    var NewBoxNoInfo = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_ST_020_C1.do',
            data: {
                'param1':C1_List,
                'event':'신규 부품식별표 정보 조회'
            },
            success: function(receivedData, setting) {
                $("#txtNBOXNO").text(receivedData.resultBoxNo);
                $("#list_st_020").removeClass("blind");

                C1_List.length = 0;
                $(".DIV_QTY").click();
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
                popupManager.instance($("[data-lng='MSG.0000000372']").text(), {showtime:"LONG"}); // 신규 부품식별표 생성에 실패했습니다
                clear();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtBOXNO").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($(".DIV_QTY").val() == 0){
            popupManager.instance($("[data-lng='MSG.0000000282']").text(), {showtime:"LONG"}); // 최소 1개 이상 수량을 입력하십시오
            $(".DIV_QTY").click();
            return;
        }

        C2_List['0']['N_BOX_NO'] = $("#txtNBOXNO").text();
        C2_List['0']['EXP_QTY'] = $("#txtEXPQTY").text();
        C2_List['0']['DIV_QTY'] = $(".DIV_QTY").val();

        save();
    }

    // PR_PDA_ST_020_C2 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_ST_020_C2.do',
            data: {
                'param1': C2_List,
                'event':'신규 부품식별표 정보 저장'
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
                console.log("error");
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                clear();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#txtBOXNO").text("");
        $("#txtPARTNO").text("");
        $("#txtQTY").text("");
        $("#txtEXPQTY").text("");

        $("#txtNBOXNO").text("");
        $(".DIV_QTY").val(0);

        $("#list_st_020").addClass("blind");

        C1_List.length = 0;
        C2_List.length = 0;
        pre_insp_dttm = "";
        saveflag = false;

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        var preQty = Number($("#txtQTY").text())-Number($(obj).val());

        if(preQty <= 0){
            popupManager.instance($("[data-lng='MSG.0000000298']").text(), {showtime:"LONG"}); // 재고수량을 초과했습니다
            $(obj).val("0");
            $("#txtEXPQTY").text(pre_count);
        } else {
            $("#txtEXPQTY").text(preQty);
        }
    };

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
		setReloadEvent: setReloadEvent,
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
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});