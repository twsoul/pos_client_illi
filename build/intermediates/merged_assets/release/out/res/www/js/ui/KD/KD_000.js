/*******************************************************************
*	메인 페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var getUSER_NM = userManager.getUSER_NM();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        getPdaMenuList();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
		$(".clearfix li").on("click", mainMovePage);
	};

	var getPdaMenuList = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/MenuList.do',
        	data: {
        		'ID': userManager.getUSER_ID(),
        		'PRT_ID': "S90000965"
        	},
        	success: function(receivedData, setting) {
        		$.each(receivedData.ListData, function(index,rowData){
        		    $("."+rowData.SCR_ID).removeClass("blind");
        		});
        	}
        });
    }


	var mainMovePage = function() {
		var page = $(this).data("page");
		if (page != "")
			screenManager.moveToPage(page);
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