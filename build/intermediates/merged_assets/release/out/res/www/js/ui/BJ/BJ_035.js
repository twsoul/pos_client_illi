/*******************************************************************
*	페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getPLANT_CD = userManager.getPLANT_CD();
    var getWERKS = optionManager.getWERKS();
    var getZPROC = optionManager.getZPROC();
    var getTPLNR = optionManager.getTPLNR();
    var getLGORT = optionManager.getLGORT();
    var getTEST = optionManager.getTEST();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
	    InspectionCodeReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
	    // 시작 버튼 클릭 시
	    $("#btnStart").on("click", function() {
        	screenManager.moveToPage("BJ_036.html", {
        	    param: {
        	        ZCODE: M.sec.encrypt($("#selZCODE option:selected").val()).result,
        	        TITLE: M.sec.encrypt($("#selZCODE option:selected").text()).result,
        	        LGORT: M.sec.encrypt($("#selPLOC option:selected").val()).result,
        	        LGOBE: M.sec.encrypt($("#selPLOC option:selected").text()).result,
        	        NAME1: M.sec.encrypt($("#txtWERKS").text()).result
        	    }
        	});
        });
	};

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
        InspectionCodeReq();
	};

    // 기간 실사 조회 함수
	var InspectionCodeReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/InspectionCodeReq.do',
            data: {
                'SERVER': getTEST,
                'bukrs': getCORP_CD,
                'tplnr': getTPLNR,
                'werks': getWERKS,
                'zproc': getZPROC,
                'event':'기간별실사 코드관리 전송'
            },
            success: function(receivedData, setting) {
                $("#selZCODE").html("");
                if(receivedData.InspectionCodeReqCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000064']").text(), {showtime:"LONG"});
                    page.moveToBack();
                    return;
                }else{
                    var tag = "";
                    $.each(receivedData.InspectionCodeReqList, function(index,rowData){
                        tag += "<option value='" + rowData.ZCODE + "'>" + rowData.TITLE + "</option>";
                    });
                    $("#selZCODE").append(tag);
                    PlantReq();
                }
            }
        });
    };

    // 플랜트 조회 함수
	var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PlantReq.do',
            data: {
                'SERVER': getTEST,
                'bukrs': getCORP_CD,
                'tplnr': getTPLNR,
                'werks': getPLANT_CD,
                'zproc': getZPROC,
                'event':'플랜트정보 전송'
            },
            success: function(receivedData, setting) {
                if(receivedData.PlantReqCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"SHORT"});
                    return;
                }else{
                    $.each(receivedData.PlantReqList, function(index,rowData){
                        if(rowData.WERKS==getWERKS){
                            $("#txtWERKS").text(rowData.NAME1);
                        }
                    });
                    StorageLocationReq();
                }
            }
        });
    };

    // 저장위치 조회 함수
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/StorageLocationReq.do',
            data: {
                'SERVER': getTEST,
                'bukrs': getCORP_CD,
                'tplnr': getTPLNR,
                'werks': getWERKS,
                'zproc': getZPROC,
                'event':'저장위치정보 전송'
            },
            success: function(receivedData, setting) {
                var tag = "";
                if(receivedData.StorageLocationReqCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"SHORT"});
                    return;
                }else{
                    $.each(receivedData.StorageLocationReqList, function(index,rowData){
                        tag += "<option value='" + rowData.LGORT + "'>" + rowData.LGOBE + "</option>";
                    });
                    $("#selPLOC").append(tag);
                    $("#selPLOC").val(getLGORT).prop("selected", true);
                }
            }
        });
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