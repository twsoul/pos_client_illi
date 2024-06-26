/*******************************************************************
*	메인 페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var saveUserCo = dataManager.storage('saveUserCo');

    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
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
		$("#btn_logout").on("click", logoutProcess);
	};

	// 자식창에 갔다가 돌아왔을때 리로드용
    var setReloadEvent = function() {
        exShowIndicator("");
        $.each(JSON.parse(dataManager.storage(optionManager.getLNG())), function(index,rowData){
            $("[data-lng='"+rowData.MSG_TYPE+"."+rowData.LANG_KEY+"']").text(rowData.MSG_DESC);
        });
        exHideIndicator("");
        getPdaMenuList();
    };

    var getPdaMenuList = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/MenuList.do',
        	data: {
        		'ID': getUSER_ID,
        		'LVL': "2"
        	},
        	success: function(receivedData, setting) {
        		$.each(receivedData.ListData, function(index,rowData){
        			$("."+rowData.SCR_ID).removeClass("blind");
        		});
        		userOption();
        	}
        });
    }

    var userOption = function() {
        var isNull = false;
        var setData = [];
        var optionID = dataManager.storage(getUSER_ID);
        if(optionID == "" || optionID == "undefined" || optionID == undefined){
            popupManager.instance("Go to the settings screen for initial setup", {showtime:"LONG"});
            setData.push({"SET_KEY":"selPLANT","SET_VALUE":"0"});
            setData.push({"SET_KEY":"selPLOC","SET_VALUE":"0"});
            setData.push({"SET_KEY":"selPLOC20","SET_VALUE":"0"});
            setData.push({"SET_KEY":"selLNG","SET_VALUE":"EN"});
            setData.push({"SET_KEY":"chkTEST","SET_VALUE":"0"});
            dataManager.storage(getUSER_ID,JSON.stringify(setData));
            screenManager.moveToPage("../common/option.html");
            return;
        }else{
            var optionList = JSON.parse(optionID);
            var exist = false;
            $.each(optionList, function(index,rowData){
                if(rowData.SET_KEY == "selPLOC20"){
                    exist = true;
                }
            });
            if(!exist){
                setData.push({"SET_KEY":"selPLANT","SET_VALUE":"0"});
                setData.push({"SET_KEY":"selPLOC","SET_VALUE":"0"});
                setData.push({"SET_KEY":"selPLOC20","SET_VALUE":"0"});
                setData.push({"SET_KEY":"selLNG","SET_VALUE":"EN"});
                setData.push({"SET_KEY":"chkTEST","SET_VALUE":"0"});
                dataManager.storage(getUSER_ID,JSON.stringify(setData));
                optionList = JSON.parse(dataManager.storage(getUSER_ID));
            }
            $.each(optionList, function(index,rowData){
                if(rowData.SET_KEY != "chkTEST"){
                    if(rowData.SET_VALUE == "0"){
                        isNull = true;
                        return false;
                    }
                }
            });
            if(isNull){
                popupManager.instance("Empty setting exists", {showtime:"LONG"});
                screenManager.moveToPage("../common/option.html");
                return;
            }else{
                M.db.create(getUSER_ID, function(status, name) {
                    if(status == "FAIL") {
                        if(name.error == "Permission Denied.") {
                            popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                            	title: $("[data-lng='MSG.0000000004']").text(),
                            	buttons:[$("[data-lng='MSG.0000000002']").text()]
                            }, function() {
                            	M.sys.exit();
                            	return;
                            });
                        }
                    }
                });
            }
        }
    };

	// 로그아웃 (process)
    var logoutProcess = function() {
        popupManager.alert($("[data-lng='MSG.0000000001']").text(), {
        	 title: $("[data-lng='MSG.0000000004']").text(),
        	 buttons: [$("[data-lng='MSG.0000000003']").text(), $("[data-lng='MSG.0000000002']").text()]
        }, function(index) {
        	 switch(index) {
        	 	 case 0:
        	 	    break;
        	 	 case 1:
        	 	    userManager.removeUserData();
                    sessionOut();
        	 	 	break;
            }
        });
    };

    var sessionOut = function(exit = false) {
    	networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/logout.do',
    		data: {},
    		success: function(receivedData, setting) {
    		    if(exit){
    		        M.sys.exit();
    		    }else{
                    screenManager.moveToPage('../common/login.html', { animation:"ZOOM_OUT", action: 'CLEAR_TOP' });
                    popupManager.instance($("[data-lng='MSG.0000000257']").text(), {showtime:"LONG"});
                }
    		},
    		error: function(){
    			popupManager.instance($("[data-lng='MSG.0000000258']").text(), {showtime:"LONG"});
    		}
    	});
    };

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
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent,
		sessionOut: sessionOut
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
	popupManager.alert($("[data-lng='MSG.0000000005']").text(), {
    	title: $("[data-lng='MSG.0000000004']").text(),
    	buttons: [$("[data-lng='MSG.0000000003']").text(), $("[data-lng='MSG.0000000002']").text()]
    }, function(index) {
    	switch(index) {
    		case 0:
    			break;
    		case 1:
    		    page.sessionOut(true);
    			break;
    	}
    });
});