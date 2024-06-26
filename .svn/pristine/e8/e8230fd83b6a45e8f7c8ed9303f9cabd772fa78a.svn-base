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
    var Box_BarCode_Arr = [];

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

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selTOPLANT").on('change', function() {
            $("#txtVEND_CD").text($("#selTOPLANT option:selected").attr('value1'));
            $("#txtVEND_NM").text($("#selTOPLANT option:selected").attr('value2'));
            StorageLocationReq();
        })

        // 저장위치 변경 시 스캔으로 포커스
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
                $("#selTOPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        var COM_CD = rowData.COM_CD == undefined ? "" : rowData.COM_CD;
                        var COM_NM = rowData.COM_NM == undefined ? "" : rowData.COM_NM;
                        tag += "<option value='" + rowData.VALUE + "' value1='" + COM_CD + "' value2='" + COM_NM + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selTOPLANT").append(tag);
                    $("#selTOPLANT").val(getWERKS).prop("selected", true);
                    $("#txtVEND_CD").text($("#selTOPLANT option:selected").attr('value1'));
                    $("#txtVEND_NM").text($("#selTOPLANT option:selected").attr('value2'));
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
                'PLANT': $("#selTOPLANT option:selected").val(),
                'TYPE': ["20"]
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
                if($("#selTOPLANT option:selected").val() == getWERKS){
                    $("#selTOLOCTP").val(getLGORT20).prop("selected", true);
                }
                $("#inputScan").focus();
            }
        });
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selTOPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selTOLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#txtVEND_CD").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000590']").text(), {showtime:"LONG"}); // 거래처 정보가 없습니다. 공통코드 등록 후 스캔해주십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.substr(0,3) != "QR*"){
            popupManager.instance($("[data-lng='MSG.0000000589']").text(), {showtime:"LONG"}); // QR코드를 스캔해주십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 스캔 시 부품식별표 조회
    var BoxNoScan = function(inputScan) {
        // 수량 || LOT || 품번
        if(inputScan.substr(13,5) == "" || inputScan.substr(18,7) == "" || inputScan.substr(29) == ""){
            popupManager.instance($("[data-lng='MSG.0000000226']").text(), {showtime:"LONG"}); // 올바르지 않은 바코드 구성입니다
            $("#inputScan").focus();
            return;
        }
        if(Box_BarCode_Arr.some(Box_BarCode_Arr => Box_BarCode_Arr.BOX_BAR_NO === inputScan)){
            popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
            $("#inputScan").focus();
            return;
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_070_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selTOPLANT").val(),
                'PART_CD':inputScan.substr(29),
                'VENDOR_CD':$("#txtVEND_CD").text(),
                'BOX_BAR_NO':inputScan,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var PartExist = false;
                var QtyOver = false;
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000591']").text(), {showtime:"LONG"}); // 유상사급 품번이 아닙니다. 기준정보 등록 후 스캔해주십시오
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BOX_YN == "Y"){
                    popupManager.instance(inputScan+" "+$("[data-lng='MSG.0000000284']").text(), {showtime:"LONG"}); // 는 이미 입고된 Box입니다
                    $("#inputScan").focus();
                    return;
                }
                if(parseInt(rowData.CNTR_QTY) < parseInt(inputScan.substr(13,5))){
                    popupManager.instance($("[data-lng='MSG.0000000588']").text(), {showtime:"LONG"}); // 통제수량을 초과하여 스캔할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }
                $("#list_in_070 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        PartExist = true;
                        if(parseInt($(this).find(".CNTR_QTY").text())-parseInt($(this).find(".SCAN_QTY").text()) < parseInt(inputScan.substr(13,5))){
                            QtyOver = true;
                        }else{
                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                            $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(inputScan.substr(13,5)));
                        }
                        $(this).prependTo('div .list_in_070:eq(1)');
                    }
                });
                if(QtyOver){
                    popupManager.instance($("[data-lng='MSG.0000000588']").text(), {showtime:"LONG"}); // 통제수량을 초과하여 스캔할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }
                if(!PartExist){
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                    var template = $("#ListTemplate").html();
                    var tag = template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                      .replace(/\{\{CNTR_QTY\}\}/, rowData.CNTR_QTY)
                                      .replace(/\{\{SCAN_QTY\}\}/, parseInt(inputScan.substr(13,5)));
                    $("#list_in_070_head").removeClass("blind");
                    $("#list_in_070").prepend(tag);
                    $("#selTOLOCTP").attr("disabled",true);
                    $("#selTOPLANT").attr("disabled",true);
                }
                Box_BarCode_Arr.push({"COPORATE_CD":getCORP_CD, "TO_PLANT_CD":$("#selTOPLANT").val(), "TO_LOC_TP":$("#selTOLOCTP").val(), "BOX_BAR_NO":inputScan, "LOT_NO":inputScan.substr(18,7), "VENDOR_CD":$("#txtVEND_CD").text(), "PART_CD":rowData.PART_CD, "SCAN_QTY":parseInt(inputScan.substr(13,5)), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                $("#inputScan").focus();
            }
        });
    }
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
        $.each(Box_BarCode_Arr,function(key,value){
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_IN_070_C1.do',
            data: {
                'param1': Box_BarCode_Arr
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
        Box_BarCode_Arr.length = 0;
        $("#list_in_070").html("");
        $("#list_in_070_head").addClass("blind");
        $("#inpBoxQty").text("0");
        $("#selTOPLANT").attr("disabled",false);
        $("#selTOLOCTP").attr("disabled",false);
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