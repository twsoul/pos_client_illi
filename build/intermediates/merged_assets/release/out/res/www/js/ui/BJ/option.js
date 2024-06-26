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
    var getARBPL = optionManager.getARBPL();
    var getZPROC = optionManager.getZPROC();
    var getLGORT = optionManager.getLGORT();
    var getTPLNR = optionManager.getTPLNR();
    var getTEST = optionManager.getTEST();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        exShowIndicator("");
        ProcTypeReq();
        exHideIndicator("");
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
    	$("#selGB").on("change", function(){
    	    ChangeCheck = true;
    	    StorageLocationReq();
    	});
    	$("#selSJ").on("change", function(){
            ChangeCheck = true;
            PlantReq();
        });
    	$("#selPLANT").on("change", function(){
    	    ChangeCheck = true;
            WcInfo();
            StorageLocationReq();
        });
        $("#selLNG").on("change", function(){
            ChangeCheck = true;
            //SiteInfo();
            //WcInfo();
        });
        $("#chkTEST").on("click", function(){
            if($(this).is(':checked')){
                getTEST = "1";
            }else{
                getTEST = "0";
            }
            exShowIndicator("");
            ProcTypeReq();
            exHideIndicator("");
        })

    };

    var ProcTypeReq = function() {
    	 networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/ProcTypeReq.do',
    		data: {
    		    'SERVER': getTEST,
    			'bukrs': getCORP_CD,
                'event':'설비관리 업무 구분 전송'
    		},
    		success: function(receivedData, setting) {
    			$("#selGB").html("");
    			if(receivedData.ProcTypeReqCount == 0){
                    popupManager.instance(receivedData.ProcTypeReqMsg, {showtime:"SHORT"});
                    $("#selPLANT").html("");
                    $("#selSJ").html("");
                    $("#selPLOC").html("");
                    $("#selJJ").html("");

                    return;
                }else{
                    var tag = "";
    			    $.each(receivedData.ProcTypeReqList, function(index,rowData){
    			    	tag += "<option value='" + rowData.ZPROC + "'>" + rowData.ZDESC + "</option>";
    			    });
    			    $("#selGB").append(tag);
    			    setSelected("selGB",getZPROC);
    			    SiteInfo();
    			}
    		}
    	});
    };

    var SiteInfo = function(){
    	networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/SiteInfo.do',
    		data: {
    		    'SERVER': getTEST,
    		    'bukrs': getCORP_CD,
    		    'spras': $("#selLNG option:selected").val(),
                'event':'ERP PM 사업장 송신1'
    		},
    		success: function(receivedData, setting) {
    		    $("#selSJ").html("");
    		    if(receivedData.SiteInfoCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"SHORT"});
                    $("#selPLANT").html("");
                    $("#selPLOC").html("");
                    $("#selJJ").html("");
                    return;
                }else{
    			    var tag = "";
    			    var tag2 = "";
                    var uniqueNames = [...new Map(receivedData.SiteInfoList.map(item => [item["SITE"], item])).values()];
                    $.each(uniqueNames, function(index,rowData){
                    	tag += "<option value='" + rowData.SITE + "'>" + rowData.PLTXT + "</option>";
                    });
                    $("#selSJ").append(tag);
                    if(!ChangeCheck){
                        setSelected("selSJ",getTPLNR);
                    }
                    PlantReq();
                }
    		}
    	});
    };

    var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/SiteInfo.do',
        	data: {
        	    'SERVER': getTEST,
        	    'bukrs': getCORP_CD,
        	    'spras': $("#selLNG option:selected").val(),
                'event':'ERP PM 사업장 송신2'
        	},
        	success: function(receivedData, setting) {
        	    $("#selPLANT").html("");
        	    if(receivedData.SiteInfoCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"SHORT"});
                    $("#selPLOC").html("");
                    $("#selJJ").html("");

                    return;
                }else{
        		    var tag = "";
                    $.each(receivedData.SiteInfoList, function(index,rowData){
                        if(rowData.SITE == $("#selSJ option:selected").val()) {
                            tag += "<option value='" + rowData.WERKS + "'>" + rowData.KTEXT + "</option>";
                        }
                    });
                    $("#selPLANT").append(tag);
                    if(!ChangeCheck){
                        setSelected("selPLANT",getWERKS);
                    }
                    StorageLocationReq();
                    WcInfo();
                }
        	}
        });
    };

    var StorageLocationReq = function() {
    	 networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/StorageLocationReq.do',
    		data: {
    		    'SERVER': getTEST,
    			'bukrs': getCORP_CD,
    			'tplnr': $("#selSJ option:selected").val(),
    			'werks': $("#selPLANT option:selected").val(),
    			'zproc': $("#selGB option:selected").val(),
                'event':'저장위치정보 전송'
    		},
    		success: function(receivedData, setting) {
    		    var tag = "";
                $("#selPLOC").html("");
    		    if(receivedData.StorageLocationReqCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"SHORT"});
                    return;
                }else{
    			    $.each(receivedData.StorageLocationReqList, function(index,rowData){
    			    	tag += "<option value='" + rowData.LGORT + "'>" + rowData.LGOBE + "</option>";
    			    });
    			    $("#selPLOC").append(tag);
    			    if(!ChangeCheck){
                        setSelected("selPLOC",getLGORT);
                    }
                }
    		}
    	});
    };

    var WcInfo = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/WcInfo.do',
            data: {
                'SERVER': getTEST,
                'bukrs': getCORP_CD,
                'werks': $("#selPLANT option:selected").val(),
                'spras': $("#selLNG option:selected").val(),
                'event':'ERP PM 작업장 송신'
            },
            success: function(receivedData, setting) {
                $("#selJJ").html("");
                if(receivedData.WcInfoCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"SHORT"});
                    return;
                }else{
                    var tag = "";
                    $.each(receivedData.WcInfoList, function(index,rowData){
                        tag += "<option value='" + rowData.ARBPL + "'>"+ rowData.KTEXT + "</option>";
                    });
                    $("#selJJ").append(tag);
                    if(!ChangeCheck){
                        setSelected("selJJ",getARBPL);
                    }
                }
            }
        });
    }

    var initData = function() {
        var optionList = JSON.parse(dataManager.storage(getUSER_ID));
        $.each(optionList, function(index,rowData){
            if(rowData.SET_KEY == "txtTERM") {
                setText(rowData.SET_KEY, rowData.SET_VALUE);
            }else{
                if(rowData.SET_KEY == "selGB"){
                }else if(rowData.SET_KEY == "chkSCAN" || rowData.SET_KEY == "chkTEST"){
                    setChecked(rowData.SET_KEY, rowData.SET_VALUE == "0" ? false : true);
                }else{
                    setSelected(rowData.SET_KEY, rowData.SET_VALUE);
                }
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
    		if(id == "chkSCAN" || id == "chkTEST"){
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
    					if (id == "chkSCAN" || id == "chkTEST"){
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
        	popupManager.instance($("[data-lng='MSG.0000000013']").text(), {showtime:"SHORT"});
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
    			popupManager.instance($("[data-lng='MSG.0000000016']").text(), {showtime:"SHORT"});
    			screenManager.moveToBack({ animation: "ZOOM_OUT" });
    		} else {
    		    dataManager.storage(getUSER_ID,JSON.stringify(saveDatas));
                popupManager.instance($("[data-lng='MSG.0000000017']").text(), {showtime:"SHORT"});
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

    var setText = function(objID, val) {
    	$("#" + objID).val(val);
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