/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var ZCODE="";
    var TITLE="";
    var LGORT="";
    var LGOBE="";
    var WERKS="";
    var NAME1="";
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getLGORT = optionManager.getLGORT();
    var getWERKS = optionManager.getWERKS();
    var getTPLNR = optionManager.getTPLNR();
    var getTEST = optionManager.getTEST();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        ZCODE = dataManager.param("ZCODE");
        TITLE = dataManager.param("TITLE");
        LGORT = dataManager.param("LGORT");
        LGOBE = dataManager.param("LGOBE");
        WERKS = getWERKS;
        NAME1 = dataManager.param("NAME1");

        $("#txtTITLE").text(TITLE);
        $("#txtWERKS").text(NAME1);
        $("#txtLGOBE").text(LGOBE);

        // 내부 DB 기간 실사 SELECT 함수
        var query = 'SELECT * FROM INSP WHERE ZCODE = "'+ZCODE+'" AND LGORT = "'+LGORT+'" AND WERKS = "'+WERKS+'"';
        M.db.execute(getUSER_ID, query, function(status, result,  name) {
            if(status == "FAIL") {
                createTABLE();
            } else {
                if(result.row_count < 1) {
                    return;
                }
                selectTABLE(result);
            }
        });
	};
	// 이벤트 초기화
	var setInitEvent = function() {
	    $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    searchValidation(inputScan);
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000048']").text(), {showtime:"SHORT"});
                }
            }
        });

        // 중간저장 버튼 클릭 시
        $("#btnSave").on("click", function(){
            StockInspectionReq("");
        });

        // 실사완료 버튼 클릭 시
        $("#btnFin").on("click",  function(){
            setSend("X");
        });
	};

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
        $("#inputScan").focus();
	};

    // 실사 차이값 계산 함수
	var inputEvent = function(obj) {
	    var QTY = $(obj).parent().siblings(".LABST").text();
        var IMSI = $(obj).parent().siblings(".ZTEMP").text();
        $(obj).parent().siblings(".DIFF").text($(obj).val()-(parseInt(QTY)-parseInt(IMSI)));
	};

    // 실사완료 확인 팝업 함수
    var setSend = function(final) {
    	popupManager.alert($("[data-lng='MSG.0000000067']").text(), {
            title: $("[data-lng='MSG.0000000004']").text(),
            buttons: [$("[data-lng='MSG.0000000003']").text(), $("[data-lng='MSG.0000000002']").text()]
    	}, function(index) {
    		switch(index) {
    			case 0:
    			    $("#inputScan").focus();
    				break;
    			case 1:
    				StockInspectionReq(final);
    				break;
    		}
    	});
    };

    // 내부 DB 기간 실사 테이블 CREATE 함수
	var createTABLE = function() {
        var query = 'CREATE TABLE IF NOT EXISTS INSP (ZCODE TEXT NOT NULL, WERKS TEXT NOT NULL, LGORT TEXT NOT NULL, MATNR TEXT NOT NULL, MAKTX TEXT, LABST TEXT, ZTEMP TEXT, MENGE TEXT, MEINS TEXT, PRIMARY KEY(ZCODE, WERKS, LGORT, MATNR))'
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            if(status == "FAIL") {
                popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                	title: $("[data-lng='MSG.0000000004']").text(),
                	buttons:[$("[data-lng='MSG.0000000002']").text()]
                }, function() {
                	M.sys.exit();
                });
            }
        });
    };

    // 내부 DB 기간 실사 DELETE 함수
    var deleteTABLE = function() {
        var query = 'DELETE FROM INSP WHERE ZCODE = "'+ZCODE+'" AND LGORT = "'+LGORT+'" AND WERKS = "'+WERKS+'"';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            $("#list_bj_031").html("");
            $(".btn_area").addClass("blind");
        });
    };

    // 내부 DB 기간 실사 데이터 표현 함수
    var selectTABLE = function(data) {
        var tag = "";
        $.each(data.row_list, function(index,rowData){
            if(rowData.MEINS == "EA"){
                var template = $("#ListTemplateEA").html();
            }else{
                var template = $("#ListTemplate").html();
            }
            tag += template.replace(/\{\{PART_NO\}\}/gi, rowData.MATNR)
                           .replace(/\{\{PART_NM\}\}/, rowData.MAKTX)
                           .replace(/\{\{QTY\}\}/, rowData.LABST)
                           .replace(/\{\{IMSI\}\}/, rowData.ZTEMP)
                           .replace(/\{\{DIFF\}\}/, parseInt(rowData.MENGE)-(parseInt(rowData.LABST)-parseInt(rowData.ZTEMP)))
                           .replace(/\{\{CNT\}\}/, parseInt(rowData.MENGE))
                           .replace(/\{\{MEINS\}\}/, rowData.MEINS)
                           .replace(/\{\{LB0000000055\}\}/,  $("[data-lng='LB.0000000055']").text())
                           .replace(/\{\{LB0000000044\}\}/,  $("[data-lng='LB.0000000044']").text())
                           .replace(/\{\{LB0000000057\}\}/,  $("[data-lng='LB.0000000057']").text())
                           .replace(/\{\{LB0000000056\}\}/,  $("[data-lng='LB.0000000056']").text());
        });
        $("#list_bj_031").append(tag);
        $(".btn_area").removeClass("blind");
    };

    // 내부 DB 기간 실사 INSERT OR REPLACE 함수
    var saveSearchList = function(){
        if($("#list_bj_031 .tableCont").children().length < 1) {
            return;
        }
        var querytag= "";
        $("#list_bj_031 .tableCont").each(function() {
            var MATNR = $(this).find(".MATNR").text();
            var MAKTX = $(this).find(".MAKTX").text();
            var LABST = $(this).find(".LABST").text();
            var ZTEMP = $(this).find(".ZTEMP").text();
            var MENGE = $(this).find(".MENGE").val();
            var MEINS = $(this).data("meins");
            var query = 'INSERT OR REPLACE INTO INSP (ZCODE, WERKS, LGORT, MATNR, MAKTX, LABST, ZTEMP, MENGE, MEINS) values ("'+ZCODE+'","'+WERKS+'","'+LGORT+'","'+MATNR+'","'+MAKTX+'","'+LABST+'","'+ZTEMP+'","'+MENGE+'","'+MEINS+'");';
            querytag += query;
        });
        M.db.execute({
            path:getUSER_ID,
            sql:querytag,
            multiple: true,
            callback: function(status, result, name) {
            }
        });
    };

    // 실사 품번 중복 확인 함수
    var searchValidation = function(inputScan) {
        var exist = false;
        $("#list_bj_031 .tableCont").each(function() {
            if($(this).data("code") == inputScan){
                exist = true;
                var MENGE = $(this).find(".MENGE").val();
                $(this).find(".MENGE").val(parseInt(MENGE)+1);
                $(this).find(".MENGE").change();
                $("#inputScan").focus();
            }
        });
        if (!exist){
        	MaterialInfoReq(inputScan);
        }
    };

    // 품번 조회 함수
	var MaterialInfoReq = function(inputScan){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/MaterialInfoReq.do',
            data: {
                'SERVER': getTEST,
            	'bukrs':getCORP_CD,
                'werks':WERKS,
                'lgort':LGORT,
                'matnr':inputScan,
                'event':'품번 조회 수신'
            },
            success: function(receivedData, setting) {
                if (receivedData.MaterialInfoReqCount == 0){
                	popupManager.instance($("[data-lng='MSG.0000000053']").text(), {showtime:"SHORT"});
                } else {
                    var rowData = receivedData.MaterialInfoReqList[0];
                    var tag = "";
                    var LABST = "";
                    if(rowData.MEINS == "EA") {
                        var template = $("#ListTemplateEA").html();
                    }else{
                        var template = $("#ListTemplate").html();
                    }
                    if(parseInt(rowData.LABST) < 0) {
                        LABST = "0"
                    }else{
                        LABST = rowData.LABST
                    }
                    tag += template.replace(/\{\{PART_NO\}\}/gi, rowData.MATNR)
                    	    	   .replace(/\{\{PART_NM\}\}/, rowData.MAKTX)
                    	    	   .replace(/\{\{QTY\}\}/, parseInt(LABST))
                    	    	   .replace(/\{\{IMSI\}\}/, parseInt(rowData.ZTEMP))
                    	    	   .replace(/\{\{DIFF\}\}/,0-(parseInt(LABST)-parseInt(rowData.ZTEMP)))
                    	    	   .replace(/\{\{CNT\}\}/, 0)
                    	    	   .replace(/\{\{MEINS\}\}/, rowData.MEINS)
                    	    	   .replace(/\{\{LB0000000055\}\}/,  $("[data-lng='LB.0000000055']").text())
                                   .replace(/\{\{LB0000000044\}\}/,  $("[data-lng='LB.0000000044']").text())
                                   .replace(/\{\{LB0000000057\}\}/,  $("[data-lng='LB.0000000057']").text())
                                   .replace(/\{\{LB0000000056\}\}/,  $("[data-lng='LB.0000000056']").text());
                    $("#list_bj_031").append(tag);
                    $(".btn_area").removeClass("blind");

                    $("#list_bj_031 .tableCont").each(function() {
                        if($(this).find(".MATNR").text() == rowData.MATNR){
                            $(this).find(".MENGE").click();
                        }
                    });
                }
            }
        });
    };

    // 중간저장, 실사완료 처리 함수
    var StockInspectionReq = function(final) {
        var inspList = [];
        $("#list_bj_031 .tableCont").each(function() {
            var MATNR = $(this).find(".MATNR").text();
            var LABST = $(this).find(".LABST").text();
            var MENGE = $(this).find(".MENGE").val();
            inspList.push({"tplnr":getTPLNR,"werks":getWERKS,"lgort":getLGORT,"matnr":MATNR,"labst":LABST,"menge":MENGE});
        });
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/StockInspectionReq.do',
            data: {
                'SERVER':getTEST,
            	'bukrs':getCORP_CD,
                'ztype':"B",
                'zcode':ZCODE,
                'empcd':getUSER_ID,
                'final':final,
                'tbody':inspList,
                'event':'보전자재 재고실사 데이터 수신(재고실사)'
            },
            success: function(receivedData, setting) {
                if(receivedData.StockInspectionReqReturn == "S") {
                    if(final == "X") {
                        popupManager.instance($("[data-lng='MSG.0000000068']").text(), {showtime:"LONG"});
                    }
                    deleteTABLE();
                    screenManager.moveToBack();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000069']").text(), {showtime:"SHORT"});
                    $("#inputScan").focus();
                }
            }
        });
    };

	var moveToBack = function() {
	    saveSearchList();
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