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

    var case_bar = "";
    var bl_no = "";
    var cont_no = "";
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 화면 초기화시 공장, 저장위치 콤보박스 조회
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
        })

        // 저장위치 변경 시 스캔으로 포커스
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

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeListLP.do',
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
        if(inputScan.length > 0) {
            if($("#txtCASE").text()==""){
                CaseNoScan(inputScan);
            }else{
                BoxNoScan(inputScan);
            }
        }
    }

    // 스캔 시 케이스 조회
    var CaseNoScan = function(casebarno) {
        var case_no = "";

        if(casebarno.length == 16){
            case_no = casebarno.substr(casebarno.length-6,6);
        }else{
            case_no = casebarno;
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwCaseNo.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOC_TP':$("#selLOCTP").val(),
                'LOGI_CD':"",
                'CASE_NO':case_no,
                'event':'케이스 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_qty = "";

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000639']").text(), {showtime:"LONG"}); // 존재하지 않는 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.OUT_FLAG == 'Y'){
                    popupManager.instance($("[data-lng='MSG.0000000738']").text(), {showtime:"LONG"}); // 이미 출고 등록된 CASE 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000740']").text(), {showtime:"LONG"}); // 보류 상태의 CASE 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(getCORP_CD != "4200"){
                    if(rowData.BLNO == undefined){
                        popupManager.instance($("[data-lng='MSG.0000000721']").text(), {showtime:"LONG"}); // B/L NO 정보가 누락 되었습니다
                        $("#inputScan").focus();
                        return;
                    }
                    if(rowData.CONT_NO == undefined){
                        popupManager.instance($("[data-lng='MSG.0000000722']").text(), {showtime:"LONG"}); // 컨테이너 정보가 누락 되었습니다
                        $("#inputScan").focus();
                        return;
                    }
                    bl_no = rowData.BLNO;
                    cont_no = rowData.CONT_NO;
                }else{
                    if(rowData.BLNO == undefined){
                        bl_no = "X";
                    }else{bl_no = rowData.BLNO;}
                    if(rowData.CONT_NO == undefined){
                        cont_no = "X";
                    }else{cont_no = rowData.CONT_NO;}
                }

                // 스캔시 플랜트와 원창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                $("#txtCASE").text(rowData.CASE_NO);
                $("#txtCASE_QTY").text(rowData.BAR_QTY);
                if(getCORP_CD != "4200"){

                }else{


                }
                case_bar = case_no;

                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표 조회
    var BoxNoScan = function(box_bar_no) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwBoxNo.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT").val(),
                'BOX_BAR_NO': box_bar_no,
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
                if(rowData.BAR_QTY < 1){
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
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

                var tag = "";
                var template = $("#ListTemplate").html();
                tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{DIV_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{LB0000000038\}\}/, $("[data-lng='LB.0000000038']").text())   // 품번
                               .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())   // 부품식별표
                               .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text())   // 스캔수량
                               .replace(/\{\{LB0000000724\}\}/, $("[data-lng='LB.0000000724']").text());  // 리팩수량

                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                $("#list_st_100").prepend(tag);

                $("#inputScan").focus();
            }
        });
    }

    // 저장 처리
    var setSaveClickEvent = function() {
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        save();
    }

    var save = function() {
        saveflag = true;
        var C1_LIST = [];

        $("#list_st_100 .tableCont").each(function() {
            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "CASE_NO":case_bar, "BLNO":bl_no, "CONT_NO":cont_no, "BOX_NO":$(this).find(".BOX_NO").text(), "BAR_QTY":parseInt($(this).find(".SCAN_QTY").text()), "SCAN_QTY":parseInt($(this).find(".DIV_QTY").val()), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
        });

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_ST_100_C1.do',
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
        case_bar = "";
        bl_no = "";
        cont_no = "";
        $("#list_st_100").html("");
        $("#txtCASE").text("");
        $("#txtCASE_QTY").text("");
        $("#inpBoxQty").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        saveflag = false;
        $("#inputScan").focus();
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;

        $("#list_st_100 .tableCont").each(function() {
            if($(this).find(".BOX_NO").text() == box_no){
                rtn = true;
                return false; // each문의 break;
            }
        });

        return rtn;
    };

    var inputEvent = function(obj) {
        if($(obj).val() == ""){
            $(obj).val(0);
        }

        if(parseInt($(obj).val())> parseInt($(obj).parent().parent().find(".SCAN_QTY").text())){
            popupManager.instance($("[data-lng='MSG.0000000723']").text(), {showtime:"LONG"}); // 리팩수량이 스캔수량보다 많습니다
            $(obj).val($(obj).parent().parent().find(".SCAN_QTY").text());
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