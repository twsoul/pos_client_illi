/*******************************************************************
*	페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var EA = false;
    var PopList = [];
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getWERKS = optionManager.getWERKS();
    var getZPROC = optionManager.getZPROC();
    var getLGORT = optionManager.getLGORT();
    var getTPLNR = optionManager.getTPLNR();
    var getLNG = optionManager.getLNG();
    var getTEST = optionManager.getTEST();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        StorageLocationReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
	    $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                $("tbody tr td span").not("#txtLGORT").each(function(){$(this).text("");});
                $("#txtPART_NO").closest("td").addClass("unsearched");
                $(".btn_area").addClass("blind");
                if(inputScan != ""){
                    MaterialInfoReq(inputScan);
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000048']").text(), {showtime:"SHORT"});
                }
            }
        });

        // 재고이동 버튼 클릭 시
        $("#btnMove").on("click", function() {
            if(EA){
                objMoveInputEA = new InSPopupEA({ title:$("[data-lng='LB.0000000046']").text(), id: "popMoveEA", label:$("[data-lng='LB.0000000043']").text(), value:$("#txtLABST").text(), label2:$("[data-lng='LB.0000000046']").text()+"(EA)", type: "number", label3:$("[data-lng='LB.0000000031']").text(), goBottom: true, submitCallback: function(val, code){
                    if(val.trim() == null || val.trim() == "undefined" || val.trim() == "" ){
                        popupManager.instance($("[data-lng='MSG.0000000049']").text(), {showtime:"SHORT"});
                        return;
                    }
                    else if(parseInt($("#txtLABST").text().trim()) - parseInt(val.trim()) < 0 || parseInt(val.trim()) < 1){
                        popupManager.instance($("[data-lng='MSG.0000000050']").text(), {showtime:"SHORT"});
                        return;
                    }
                    MoveStockReq(val,code);
                }});
                objMoveInputEA.init();
                objMoveInputEA.setDB(PopList, "LGORT", "LGOBE");
                objMoveInputEA.show();
                $("#popMoveEA input").focus();
            }else{
                objMoveInput = new InSPopup({ title:$("[data-lng='LB.0000000046']").text(), id: "popMove", label:$("[data-lng='LB.0000000043']").text(), value:$("#txtLABST").text(), label2:$("[data-lng='LB.0000000046']").text(), type: "number", label3:$("[data-lng='LB.0000000031']").text(), goBottom: true, submitCallback: function(val, code){
                    if(val.trim() == null || val.trim() == "undefined" || val.trim() == "" ){
                        popupManager.instance($("[data-lng='MSG.0000000049']").text(), {showtime:"SHORT"});
                        return;
                    }
                    else if(parseInt($("#txtLABST").text().trim()) - parseInt(val.trim()) < 0 || parseInt(val.trim()) < 0){
                        popupManager.instance($("[data-lng='MSG.0000000050']").text(), {showtime:"SHORT"});
                        return;
                    }
                    MoveStockReq(val,code);
                }});
                objMoveInput.init();
                objMoveInputEA.setDB(PopList, "LGORT", "LGOBE");
                objMoveInput.show();
                $("#popMove input").focus();
            }
        });

        // BIN변경 버튼 클릭 시
        $("#btnChange").on("click", function() {
            objChangeInput = new InputPopup({ title:$("[data-lng='LB.0000000047']").text(), id: "popChange", type: "text", label:$("[data-lng='LB.0000000045']").text(), value:$("#txtLGPBE").text(), label2:$("[data-lng='LB.0000000051']").text(), goBottom: true, submitCallback: function(val){
                if(val.trim() == null || val.trim() == undefined || val.trim() == "" ){
                    popupManager.instance($("[data-lng='MSG.0000000052']").text(), {showtime:"SHORT"});
                    return;
                }
                ModifyBinReq(val);
            }});
            objChangeInput.init();
            objChangeInput.show();
            $("#popChange input").focus();
        });

        // 인쇄 버튼 클릭 시
        $("#btnPrint").on("click", function() {
            objPrintInput = new InputPopupEA({ title:$("[data-lng='LB.0000000020']").text(), id: "popPrint", type: "number", label:$("[data-lng='LB.0000000021']").text()+"(EA)", goBottom: true, submitCallback: function(code){
                if(code == null || code == undefined || code == "" || code < 1){
                    return;
                }
                var MATNR=$("#txtPART_NO").text();
                var MAKTX=$("#txtMAKTX").text();
                var GROES=$("#txtGROES").text();
                var LGPBE=$("#txtLGPBE").text();
                var ZSIGD=$("#txtZSIGD").text();
                if(ZSIGD.trim() == ""){
                    ZSIGD = window.Utils.getTodayFormat("yyyy.MM.dd");
                }
                exWNPrintLabel(getZPROC, getLNG, MATNR, MAKTX, GROES, LGPBE, ZSIGD, code);
            }});
            objPrintInput.init();
            objPrintInput.show();
            $("#popPrint input").focus();
        });
	};

	// 품번 조회 함수
    var MaterialInfoReq = function(inputScan){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/MaterialInfoReq.do',
            data: {
                'SERVER': getTEST,
            	'bukrs':getCORP_CD,
                'werks':getWERKS,
                'lgort':getLGORT,
                'matnr':inputScan,
                'event':'품번 조회 수신'
            },
            success: function(receivedData, setting) {
                if (receivedData.MaterialInfoReqCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000053']").text(), {showtime:"SHORT"});
                } else {
                    var rowData = receivedData.MaterialInfoReqList[0];
                    if(rowData.MEINS == "EA") {
                        EA = true;
                    }else{
                        EA = false;
                    }
                    $("#txtZSIGD").text(window.Utils.replaceAll(rowData.ZSIGD,"-", "."))
                    $("#txtMAKTX").text(rowData.MAKTX)
                    $("#txtPART_NO").text(rowData.MATNR)
                    $("#txtGROES").text(rowData.GROES)
                    $("#txtZCOST").text(rowData.ZCOST)
                    $("#txtLABST").text(rowData.LABST)
                    $("#txtZTEMP").text(rowData.ZTEMP)
                    $("#txtLGPBE").text(rowData.LGPBE)
                    $("#txtPART_NO").closest("td").removeClass("unsearched");
                    $(".btn_area").removeClass("blind");
                    $("#btnMove").removeClass("blind");
                }
                $("#inputScan").focus();
            }
        });
    };

    // 저장위치 조회 함수
    var StorageLocationReq = function() {
    	networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/StorageLocationReq.do',
    		data: {
    		    'SERVER':getTEST,
    			'bukrs':getCORP_CD,
    			'tplnr':getTPLNR,
    			'werks':getWERKS,
    			'zproc':getZPROC,
                'event':'저장위치정보 전송'
    		},
    		success: function(receivedData, setting) {
    		    if(receivedData.StorageLocationReqCount == 0){
                   popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"SHORT"});
                   return;
                }else{
                    $.each(receivedData.StorageLocationReqList, function(index,rowData){
                        PopList.push({LGORT:rowData.LGORT,LGOBE:rowData.LGOBE});
                        if(rowData.LGORT == getLGORT){
                            $("#txtLGORT").text(rowData.LGOBE);
                        }
                    });
                }
    		}
    	});
    };

    // 재고이동 처리 함수
    var MoveStockReq = function(val, code) {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/MoveStockReq.do',
        	data: {
        	    'SERVER':getTEST,
        		'bukrs': getCORP_CD,
        		'matnr': $("#txtPART_NO").text(),
        		'werks_f': getWERKS,
        		'lgort_f': getLGORT,
        		'werks_t': getWERKS,
                'lgort_t': code,
                'menge': val,
                'event':'창고재고 이동 수신'
        	},
        	success: function(receivedData, setting) {
        	    popupManager.instance(receivedData.MoveStockReqMsg, {showtime:"SHORT"});
        	    if(receivedData.MoveStockReqReturn == "S") {
        	        var e = $.Event( "keypress", { keyCode: 13 } );
                    $("#inputScan").val($("#txtPART_NO").text());
                    $("#inputScan").focus();
                    $("#inputScan").trigger(e);
        	    }
        	}
        });
    };

    // BIN변경 처리 함수
    var ModifyBinReq = function(val) {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/ModifyBinReq.do',
        	data: {
        	    'SERVER':getTEST,
        		'bukrs': getCORP_CD,
        		'werks': getWERKS,
        		'lgort': getLGORT,
        		'matnr': $("#txtPART_NO").text(),
                'lgpbe': val,
                'event':'BIN 변경 수신'
        	},
        	success: function(receivedData, setting) {
        	    popupManager.instance(receivedData.ModifyBinReqMsg, {showtime:"SHORT"});
        	    if(receivedData.ModifyBinReqReturn == "S") {
        	        var e = $.Event( "keypress", { keyCode: 13 } );
                    $("#inputScan").val($("#txtPART_NO").text());
                    $("#inputScan").focus();
                    $("#inputScan").trigger(e);
        	    }
        	}
        });
    };

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
        $("#inputScan").focus();
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