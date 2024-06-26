/*******************************************************************
*	메인 페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var setData = [];
    var loadData = [];
    var ChangeCheck = false;
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLGORT20 = optionManager.getLGORT20();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');
	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        setSelected("selLNG",getLNG);
        PlantReq();
        initData();
	};

	var setInitEvent = function() {
	    $(".btn_chk").on("click", function(){
    		var mode = false;
    		$(this).toggleClass("checked");
    		if( $(this).hasClass("checked") ){
    			$(this).children().find("input").attr("checked", "checked");
    			mode = true;
    		}else{
    			$(this).children().find("input").removeAttr("checked");
    		}
    	});
    	$("#selLNG").on("change", function(){
    	    ChangeCheck = true;
            PlantReq();
        });
        $("#selPLANT").on("change", function(){
            ChangeCheck = true;
            LocReq();
            LocReq20();
        });
    };

    var PlantReq = function() {
    	 networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/PlantCodeList.do',
    		data: {
            	'LANG': $("#selLNG option:selected").val(),
            	'WERKS': getCORP_CD
            },
    		success: function(receivedData, setting) {
    		    $("#selPLANT").html("");
    		    if(receivedData.ListCount == 0){
    		        popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
    		    }else{
    		        var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                    	tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    if(!ChangeCheck){
                        setSelected("selPLANT",getWERKS);
                    }
                    LocReq();
                    LocReq20();
    		    }
    		}
    	});
    };

    // 저장 위치 콤보박스 정보 조회
    var LocReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["10"]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selPLOC").html("");
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selPLOC").append(tag);
                if(!ChangeCheck){
                    setSelected("selPLOC",getLGORT);
                }
        	}
        });
    }

    // 저장 위치 콤보박스 정보 조회
    var LocReq20 = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["20"]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selPLOC20").html("");
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selPLOC20").append(tag);
                if(!ChangeCheck){
                    setSelected("selPLOC20",getLGORT20);
                }
        	}
        });
    }

    var initData = function() {
        var optionList = JSON.parse(dataManager.storage(getUSER_ID));
        $.each(optionList, function(index,rowData){
            if(rowData.SET_KEY == "chkTEST"){
                setChecked(rowData.SET_KEY, rowData.SET_VALUE == "0" ? false : true);
            }else{
                setSelected(rowData.SET_KEY, rowData.SET_VALUE);
            }
            loadData.push({"KEY":rowData.SET_KEY,"VALUE":rowData.SET_VALUE});
        });
    };

    var saveData = function() {
    	var isChanged = false;
    	var isNull = false;
    	var saveDatas = [];
    	// Push On/Off
    	$(".option").each(function(){
    		var id = $(this).attr("name");
    		var isChecked = $(this).prop("checked");
    		var val = $(this).val();
    		if(val == "" || val == null || val == "undefined" || val == undefined){
                isNull = true;
                return false;
    		}
    		if(id == "chkTEST"){
    		    var rowData = {"SET_KEY":id,"SET_VALUE":(isChecked ? "1" : "0")};
    		}else{
    		    var rowData = {"SET_KEY":id,"SET_VALUE":val};
    		}
    		saveDatas.push(rowData);

    		if (loadData.length > 0){
    			var isExist = false;
    			$(loadData).each(function(index,data){
    				if (data.KEY == id){
    					isExist = true;
    					if (id == "chkTEST"){
    					    if (data.VALUE != isChecked){
                                isChanged = true;
                            }
    					}else{
    					    if (data.VALUE != val){
                                isChanged = true;
    					    }
    					}
    					return false;
    				}
    			});
    			if (!isExist) {
    				isChanged = true;
    			}
    		} else {
    			isChanged = true;
    		}
    	});

    	if (isNull){
        	popupManager.instance($("[data-lng='MSG.0000000013']").text(), {showtime:"LONG"});
        	return false;
        }

    	if (!isChanged){
    		popupManager.instance($("[data-lng='MSG.0000000014']").text(), {showtime:"LONG"});
    		screenManager.moveToBack({ animation: "ZOOM_OUT" });
    		return false;
    	}

    	popupManager.alert($("[data-lng='MSG.0000000015']").text(), {
    		title:$("[data-lng='MSG.0000000004']").text(),
    		buttons: [$("[data-lng='MSG.0000000003']").text(),$("[data-lng='MSG.0000000002']").text()]
    	}, function(index){
    		if (index == 0){
    			popupManager.instance($("[data-lng='MSG.0000000016']").text(), {showtime:"LONG"});
    			screenManager.moveToBack({ animation: "ZOOM_OUT" });
    		} else {
    		    dataManager.storage(userManager.getUSER_ID(),JSON.stringify(saveDatas));
                popupManager.instance($("[data-lng='MSG.0000000017']").text(), {showtime:"LONG"});
                screenManager.moveToPage('../common/main.html', { action: 'CLEAR_TOP', animation: "ZOOM_OUT", param:{"CHANGE": "Y"} });
    		}
    	});
    };


    var setChecked = function(objID, mode) {
    	if (mode){
    		$("#" + objID).prop("checked",true).attr("checked","checked").parent().parent().addClass("checked");
    	} else {
    		$("#" + objID).removeAttr("checked").parent().parent().removeClass("checked");
    	}

    };

    var setSelected = function(objID, val) {
    	if (val!="0"){
    		$("#" + objID).val(val).prop("selected", true);
    	} else {
    	    $("#" + objID+" option:eq(0)").prop("selected", true);
    	}

    };

	var moveToBack = function() {
	    saveData();
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