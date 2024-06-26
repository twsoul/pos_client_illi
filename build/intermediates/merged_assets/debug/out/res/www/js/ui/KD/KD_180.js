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

    var C1_LIST = [];
    var C2_LIST = [];

    var saveflag = false;

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
    var LogiReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtCkdLogi.do',
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
        inputScan = upperManager.Upper(inputScan);
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if($("#selLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        if($("#selLOGI").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000633']").text(), {showtime:"LONG"}); // 사외창고를 먼저 선택하십시오
            return;
        }
        if(inputScan.length > 0) {
            if(head_tail_chk(inputScan)){
                BoxNoScan(inputScan);
            }else{
                CaseNoScan(inputScan);
            }
        }
    }

    var head_tail_chk = function(barcode){
        var head,tail;
        head = barcode.substr(0,4);
        tail = barcode.substr(barcode.length-4,4);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
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
            path: 'api/selectVwCaseOnly.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOC_TP':$("#selLOCTP").val(),
                'LOGI_CD':$("#selLOGI").val(),
                'CASE_NO':case_no,
                'event':'케이스 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000639']").text(), {showtime:"LONG"}); // 존재하지 않는 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000740']").text(), {showtime:"LONG"}); // 보류 상태의 CASE 입니다
                    $("#inputScan").focus();
                    return;
                }
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
                if (IsNotExitList(case_no)) {
                    popupManager.instance($("[data-lng='MSG.0000000745']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 CASE NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔시 플랜트, 저장위치, 사외창고 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $("#LOGI_CD").attr("disabled",true);

                $("#list_kd_180_head").removeClass("blind");

                var tag = "";
                var template = $("#ListTemplate").html();

                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{NUMBER\}\}/, case_no)
                                   .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{UNIT\}\}/, 'CASE')
                                   .replace(/\{\{QTY\}\}/, rowData.BAR_QTY);
                });
                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                $("#list_kd_180").prepend(tag);

                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표 조회
    var BoxNoScan = function(box_bar_no) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO': box_bar_no,
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
                if(rowData.BAR_QTY < 1){
                    popupManager.instance($("[data-lng='MSG.0000000758']").text(), {showtime:"LONG"}); // 재고가 없는 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔시 플랜트, 저장위치, 사외창고 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $("#LOGI_CD").attr("disabled",true);

                $("#list_kd_180_head").removeClass("blind");

                var tag = "";
                var template = $("#ListTemplate").html();
                tag += template.replace(/\{\{NUMBER\}\}/, rowData.BOX_NO)
                               .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                               .replace(/\{\{UNIT\}\}/, 'BOX')
                               .replace(/\{\{QTY\}\}/, rowData.BAR_QTY);

                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty2").text(parseInt($("#inpBoxQty2").text())+1);

                $("#list_kd_180").prepend(tag);

                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0" && $("#inpBoxQty2").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        save();
    }

    var save = function() {
        saveflag = true;
        var C1_LIST = [];

        $("#list_kd_180 .tableCont").each(function() {
            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "LOGI_CD":$("#selLOGI").val(), "NUMBER":$(this).find(".NUMBER").text(), "PART_CD":$(this).find(".PART_CD").text(), "UNIT":$(this).find(".UNIT").text(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM,"RTN_MSG":""});
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_180_C1.do',
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

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_180").html("");
        $("#list_kd_180_head").addClass("blind");

        $("#inpBoxQty").text("0");
        $("#inpBoxQty2").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);

        saveflag = false;
        $("#inputScan").focus();
    }

    // Number가 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(number){
        var rtn = false;

        $("#list_kd_180 .tableCont").each(function() {
            if($(this).find(".NUMBER").text() == number){
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