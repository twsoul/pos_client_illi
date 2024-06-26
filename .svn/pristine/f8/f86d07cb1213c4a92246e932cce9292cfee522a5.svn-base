/*******************************************************************
*	페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getZPROC = optionManager.getZPROC();
    var getTPLNR = optionManager.getTPLNR();
    var getLNG = optionManager.getLNG();
    var getTEST = optionManager.getTEST();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        ApprovalReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
		$("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                $("tbody tr td span").each(function(){$(this).text("");});
                $("#txtINVOICE_NO").closest("td").addClass("unsearched");
                $("#list_bj_010").html("");
                $(".btn_area").addClass("blind");
                if(inputScan != ""){
                    InvoiceInfoReq(inputScan);
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000007']").text(), {showtime:"SHORT"});
                    $("#inputScan").focus();
                }
            }
        });

        $("#selPHASE02").on("change", function() {
            $("#inputScan").focus();
        });
        $("#selPHASE03").on("change", function() {
            $("#inputScan").focus();
        });

        // 입고 버튼 클릭 시
        $("#btnInsert").on("click", function() {
            ReceiptReq();
        });

        // 라벨인쇄 버튼 클릭 시
        $("#btnPrint").on("click", function() {
            objPrintInput = new InputPopupEA({ title:$("[data-lng='LB.0000000020']").text(), id: "popPrint", type: "number", label:$("[data-lng='LB.0000000021']").text()+"(EA)", goBottom: true, submitCallback: function(code){
                if(code == null || code == undefined || code == "" || code < 1){
                    return;
                }
                var MATNR=$("#list_bj_010 .tableCont").find(".MATNR").text();
                var MAKTX=$("#list_bj_010 .tableCont").find(".MAKTX").text();
                var GROES=$("#list_bj_010 .tableCont").data("groes");
                var LGPBE=$("#list_bj_010 .tableCont").data("lgpbe");
                var ZSIGD=$("#list_bj_010 .tableCont").data("zsigd");
                var BUDAT=$("#list_bj_010 .tableCont").data("budat");
                if(ZSIGD.trim() == ""){
                    if(BUDAT.trim() == ""){
                        ZSIGD = window.Utils.getTodayFormat("yyyy.MM.dd");
                    }else{
                        ZSIGD = BUDAT;
                    }
                }
                exWNPrintLabel(getZPROC, getLNG, MATNR, MAKTX, GROES, LGPBE, ZSIGD.replace(/\-/g, "."), code);
            }});
            objPrintInput.init();
            objPrintInput.show();
            $("#popPrint input").focus();
        });

	};

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
        $("#inputScan").focus();
	};

	// 송장 정보 조회 함수
	var InvoiceInfoReq = function(inputScan){
	    networkManager.httpSend({
	        server: saveUserCo,
            path: 'api/InvoiceInfoReq.do',
            data: {
                'SERVER':getTEST,
            	'bukrs':getCORP_CD,
                'tplnr':getTPLNR,
                'werks':getWERKS,
                'zgubun':'C',
                'zinvon':inputScan,
                'event':'송장 조회 수신'
            },
            success: function(receivedData, setting) {
                $("#list_bj_010").html("");
                if (receivedData.InvoiceInfoReqCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000008']").text(), {showtime:"SHORT"});
                } else {
                    var WAERS = "";
                    var tag = "";
                	var template = $("#ListTemplate").html();
                	$.each(receivedData.InvoiceInfoReqList, function(index,rowData){
                		tag += template.replace(/\{\{INDEX\}\}/, index+1)
                		               .replace(/\{\{GROES\}\}/, rowData.GROES)
                		               .replace(/\{\{LGPBE\}\}/, rowData.LGPBE)
                		               .replace(/\{\{ZSIGD\}\}/, rowData.ZSIGD)
                		               .replace(/\{\{BUDAT\}\}/, rowData.BUDAT)
                		               .replace(/\{\{ZIVSEQ\}\}/, rowData.ZIVSEQ)
                				       .replace(/\{\{PART_NO\}\}/, rowData.MATNR)
                				       .replace(/\{\{STATUS\}\}/, rowData.ZFTUS)
                				       .replace(/\{\{PART_NM\}\}/, rowData.MAKTX)
                				       .replace(/\{\{QTY\}\}/, rowData.MENGE)
                				       .replace(/\{\{PRICE\}\}/, rowData.ZSUM_AMT+" ("+rowData.WAERS+")")
                				       .replace(/\{\{LB0000000019\}\}/, $("[data-lng='LB.0000000019']").text())
                				       .replace(/\{\{LB0000000015\}\}/, $("[data-lng='LB.0000000015']").text());
                		if(index == 0){WAERS = " ("+rowData.WAERS+")"}
                	});
                    $("#list_bj_010").append(tag);
                    $("#txtINVOICE_NO").text(inputScan);
                    $("#txtINVOICE_NO").closest("td").removeClass("unsearched");
                    $("#txtTOTAL").text(receivedData.InvoiceInfoReqSum + WAERS);
                    $("#txtCNT").text(receivedData.InvoiceInfoReqCount);
                    $(".btn_area").removeClass("blind");
                }
                $("#inputScan").focus();
            }
        });
	};

    // 입고결재선 조회 함수
	var ApprovalReq = function() {
	    networkManager.httpSend({
	        server: saveUserCo,
            path: 'api/ApprovalReq.do',
            data: {
                'SERVER':getTEST,
            	'bukrs':getCORP_CD,
                'tplnr':getTPLNR,
                'werks':getWERKS,
                'zproc':getZPROC,
                'event':'시스템 설정 - 입고결재선 전송'
            },
            success: function(receivedData, setting) {
                if (receivedData.ApprovalReqCount == 0){
                	popupManager.instance($("[data-lng='MSG.0000000006']").text(), {showtime:"LONG"});
                    page.moveToBack();
                    return;
                } else {
                	var PHASE02 = "";
                	var PHASE03 = "";
                	$.each(receivedData.ApprovalReqList, function(index,rowData){
                	    if(rowData.PHASE == "02") {
                            PHASE02 += "<option value='" + rowData.EMPCD + "'>" + rowData.SNAME + "</option>";
                	    }
                	    if(rowData.PHASE == "03") {
                	        PHASE03 += "<option value='" + rowData.EMPCD + "'>" + rowData.SNAME + "</option>";
                	    }
                	});
                	if(PHASE03 == ""){
                	    popupManager.instance($("[data-lng='MSG.0000000006']").text(), {showtime:"LONG"});
                        page.moveToBack();
                        return;
                	}
                	if(PHASE02 != ""){
                	    $(".selPHASE02").removeClass("blind");
                	    $("#selPHASE02").html("");
                	    $("#selPHASE02").append(PHASE02);
                        $("#selPHASE03").append(PHASE03);
                	}else{
                	    $("#selPHASE03").append(PHASE03);
                	}
                }
            }
        });
	}

    // 입고 처리 함수
	var ReceiptReq = function() {
	    networkManager.httpSend({
	        server: saveUserCo,
            path: 'api/ReceiptReq.do',
            data: {
                'SERVER':getTEST,
            	'bukrs':getCORP_CD,
                'tplnr':getTPLNR,
                'werks':getWERKS,
                'zinvon':$("#txtINVOICE_NO").text(),
                'empcd1':getUSER_ID,
                'empcd2':$("#selPHASE02 option:selected").val(),
                'empcd3':$("#selPHASE03 option:selected").val(),
                'zproc':getZPROC,
                'event':'입고처리 수신'
            },
            success: function(receivedData, setting) {
                if(receivedData.ReceiptReqReturn == "S"){
                    popupManager.instance(receivedData.ReceiptReqMsg, {showtime:"SHORT"});
                    var e = $.Event( "keypress", { keyCode: 13 } );
                    $("#inputScan").val($("#txtINVOICE_NO").text());
                    $("#inputScan").focus();
                    $("#inputScan").trigger(e);
                }else{
                    popupManager.instance(receivedData.ReceiptReqMsg, {showtime:"SHORT"});
                }
            }
        });
	}

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