/*******************************************************************
*	로그인 페이지 메인 로직
*******************************************************************/
var isRunning = false;
var isSecu;
var version;
var page = (function(window, document, $, M, undefined) {
	debugger;
    var objAdminLogin;
	// 화면 초기화
	var setInitScreen = function() {
	    version = exWNVersionInfo();
	    debugger;
        $("#txtVersion").val('Ver ' + version);

		pwKeypad();

		// 테스트용 (업로드)
		$("#btnTEST3").on("click", function() {
			screenManager.moveToPage('TEST.html');
		});



		$("#btnGET").on("click", function() {
            LocationMoveCode();
		});

		// 송장 정보 조회 함수
        var LocationMoveCode = function(inputScan){
            networkManager.httpSend({
                server: "11",
                path: 'api/LocationMoveCode.do',
                data: {
                    'SERVER':'0',
                	'PLANT_CD':'P1',
                    'LINE_CD':'P1A2',
                    'GROUP_ID':'100',
                    'event':'출하 구분정보'
                },
                success: function(receivedData, setting) {
                    $.each(receivedData.LocationMoveCodeList, function(index,rowData){
                        console.log(rowData.LocationMoveCode);
                    });
                }
            });
        };

		$("#btnGET2").on("click", function() {
            var query = 'SELECT * FROM PVNT WHERE WERKS = "'+optionManager.getWERKS()+'" AND GSTRP = "20210119" AND ARBPL = "'+optionManager.getARBPL()+'" AND ZPROC = "'+optionManager.getZPROC()+'"';
            M.db.execute(userManager.getUSER_ID(), query, function(status, result,  name) {
                alert(query);
                alert(status+" / "+JSON.stringify(result)+" / "+name);
            });
		});

		$("#btnGET3").on("click", function() {
            var query = 'DROP TABLE PVNT';
            M.db.execute(userManager.getUSER_ID(), query, function(status, result, name) {
                alert("createDB : "+status+" / "+JSON.stringify(result)+" / "+name);
            })
        });

        $("#comp").on("change", function() {
            if($(this).val() == "HPT" || $(this).val() == "DG"  || $(this).val() == "KJ" ) {
                $("[data-lng='confirm']").text("확인");
                $("[data-lng='cancel']").text("취소");
                $("[data-lng='alert']").text("알림");
                $("[data-lng='update']").text("앱 버전이 최신버전이 아닙니다\r\n최신버전으로 업데이트 하십시오");
                $("[data-lng='nopw']").text("패스워드를 입력하세요");
                $("[data-lng='noid']").text("아이디를 입력하세요");
                $("[data-lng='nouser']").text("계정정보가 올바르지 않습니다");
                $("[data-lng='chgpw']").text("패스워드가 변경되었습니다!\r\n새로운 패스워드로 로그인 하십시오");
                $("[data-lng='noco']").text("아직은 사용할 수 없는 법인입니다");
                $("[data-lng='noserver']").text("서버와의 연결이 실패했습니다\r\n앱이 종료됩니다");
                $("[data-lng='quit']").text("정말 앱을 종료하시겠습니까?");
                $("[data-lng='chgpwpop']").text("최초 로그인 패스워드 변경");
                $("[data-lng='newpw']").text("새 패스워드");
                $("[data-lng='conpw']").text("새 패스워드 재입력");
                $("[data-lng='diffpw']").text("패스워드가 서로 다릅니다");
                $("[data-lng='oldpw']").text("기존 패스워드와 같습니다");
                $("[data-lng='nochgpw']").text("새 패스워드를 입력 하십시오");
                $("[data-lng='sessionerror']").text("입력한 ID는 이미 사용중이거나 비정상적으로 종료된 상태입니다\r\n기존 접속을 종료하고 로그인하시겠습니까?");
                $("[data-lng='sessionfail']").text("기존 접속 종료 중 에러가 발생했습니다");
                $(this).parent().parent().attr("name", "HPT");
            }else{
                $("[data-lng='confirm']").text("Confirm");
                $("[data-lng='cancel']").text("Cancel");
                $("[data-lng='alert']").text("Alert");
                $("[data-lng='update']").text("This application is out of date\r\nPlease re-install");
                $("[data-lng='nopw']").text("Please enter your password");
                $("[data-lng='noid']").text("Please enter your ID");
                $("[data-lng='nouser']").text("Account information is incorrect");
                $("[data-lng='chgpw']").text("Password Changed!\r\nSign in with your New Password");
                $("[data-lng='noco']").text("Unavailable Country yet");
                $("[data-lng='noserver']").text("Failure to connect the server\r\nThe program will be terminated");
                $("[data-lng='quit']").text("Are you sure you want to quit?");
                $("[data-lng='chgpwpop']").text("First Sign In Changing Password");
                $("[data-lng='newpw']").text("New Password");
                $("[data-lng='conpw']").text("Confirm Password");
                $("[data-lng='diffpw']").text("Passwords are different");
                $("[data-lng='oldpw']").text("New Password is same as old one");
                $("[data-lng='nochgpw']").text("Type New Password");
                $("[data-lng='sessionerror']").text("ID already in use or abnormally terminated\r\nDo you want to close the existing connection and sign in?");
                $("[data-lng='sessionfail']").text("An error occurred while closing an existing connection");
                if($(this).val() == "PTM" || $(this).val() == "PTC") {
                    popupManager.alert($("[data-lng='noco']").text(), {
                    	title: $("[data-lng='alert']").text(),
                    	buttons:[$("[data-lng='confirm']").text()]
                    }, function() {
                    	$("#comp").val("PTA").prop("selected", true);
                    	$("#comp").change();
                    	return;
                    });
                }else{
                    $(this).parent().parent().attr("name", $(this).val());
                }
            }
        });

        if (dataManager.storage('saveUserCo')) {
    		$("#comp").val(dataManager.storage('saveUserCo')).prop("selected", true);
    		$("#comp").change();
        }else{
            $("#comp").val("HPT").prop("selected", true);
            $("#comp").change();
        }

		if (dataManager.storage('saveUserId')) {
        	$('#txtLogID').val(dataManager.storage('saveUserId'));
        	//$("#txtLogPW").val(dataManager.storage('saveUserPw'));
        	$('#chk_holdInfo').prop('checked', true);
        	$("#txtLogPW").focus();
        }else{
            $("#txtLogID").focus();
        }
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#txtLogID").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                $("#txtLogPW").click();
            }
        });
	    $("#txtLogPW").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                loginProcess();
            }
        });
		$("#btn_login").on("click", loginProcess);
	};

	// 로그인 (process)
	var loginProcess = function(ok = true) {
        exShowIndicator("");
	    var co;

        co = "test";
        dataManager.storage("saveUserCo", co);

    	networkManager.httpSend({
    	    server: $("#comp").val(),
            path: 'api/versionCheck.do',
            indicator: {show:false},
            data: {
            	'version': version
            },
            success: function(receivedData, setting) {
            debugger;
                if(receivedData.RESULT == "OK"){
                    login(id, pw);
                }else if(receivedData.RESULT == "NG"){
                    exHideIndicator("");
                    popupManager.alert($("[data-lng='update']").text(), {
                    	 title: $("[data-lng='alert']").text(),
                    	 buttons: [$("[data-lng='confirm']").text()]
                    }, function() {
                        switch(co) {
                            case 'HPT':
                            	apkUrl = "https://madp.hyundai-transys.com:480/"
                            break;
                            case 'DG':
                            	apkUrl = "http://10.214.38.60:8080/H_able_Server/"
                            break;
                            case 'KJ':
                            	apkUrl = "http://10.214.253.27:8080/H_able_Server/"
                            break;
                            case 'PTA':
                                apkUrl = "https://pdagp.hyundai-transys.com:480/H_able_Server/"
                            break;
                            case 'GAST':
                                apkUrl = "https://10.120.235.25:480/"
                            break;
                            case 'ILST':
                                apkUrl = "https://pdais.hyundai-transys.com:480/"
                            break;
                            case 'ABST':
                                apkUrl = ""
                            break;
                            case 'ARST':
                                apkUrl = ""
                            break;
                            case 'PTM':
                                apkUrl = "https://madp.hyundai-transys.com:460/H_able_Server/"
                            break;
                            case 'PTI':
                                apkUrl = "http://10.108.95.36:8080/H_able_Server/"
                            break;
                            case 'PTC':
                                apkUrl = "https://madp.hyundai-transys.com:460/H_able_Server/"
                            break;
                        }
                        M.apps.browser(apkUrl);
                    });
                    return;
                }else{

                    if(ok){
                        exHideIndicator("");
                        loginProcess(false)
                    }else{
                        exHideIndicator("");
                        popupManager.alert($("[data-lng='noserver']").text(), {
                          	title: $("[data-lng='alert']").text(),
                          	buttons:[$("[data-lng='confirm']").text()]
                        }, function() {
                        	M.sys.exit();
                        });
                    }
                }
            },
            error: function(errorCode, errorMessage, setting) {
                if(ok){
                    exHideIndicator("");
                    loginProcess(false)
                }else{
                    exHideIndicator("");
                    popupManager.alert($("[data-lng='noserver']").text(), {
                      	title: $("[data-lng='alert']").text(),
                      	buttons:[$("[data-lng='confirm']").text()]
                    }, function() {
                    	M.sys.exit();
                    });
                }
            }
        });
	};

	var login = function(id, pw) {
	    networkManager.httpSend({
	        server: $("#comp").val(),
            path: 'api/login.do',
            indicator: {show:false},
            data: {
            	'user_id': id,
            	'user_pw': pw
            },
            success: function(receivedData, setting) {
                if(receivedData.RESULT == "OK"){
                    if(receivedData.SESSION == "OK"){
                        var user = receivedData.AUTH_INFO;
                        userManager.setUserData(user);
                        getPdaLangList();
                    }else{
                        exHideIndicator("");
                        popupManager.alert($("[data-lng='sessionerror']").text(), {
                        	title: $("[data-lng='alert']").text(),
                        	buttons: [$("[data-lng='cancel']").text(), $("[data-lng='confirm']").text()]
                        }, function(index) {
                        	switch(index) {
                        		case 0:
                        			break;
                        		case 1:
                        			sessionOut(id);
                        			break;
                        	}
                        });
                    }
                }else if(receivedData.RESULT == "PW"){
                    exHideIndicator("");
                    objPWchg = new PWchangePopup({id: "popChangePW", title:$("[data-lng='chgpwpop']").text(), label1:$("[data-lng='newpw']").text(), label2:$("[data-lng='conpw']").text(), confirm:$("[data-lng='confirm']").text(), cancel:$("[data-lng='cancel']").text(), msg1:$("[data-lng='diffpw']").text(), msg2:$("[data-lng='oldpw']").text(), msg3:$("[data-lng='nochgpw']").text(), value:id, pw:pw, goBottom: true, submitCallback: function(code, val){
                        ChangePW(code,val);
                    }});
                    objPWchg.init();
                    objPWchg.show();
                    $("#popChangePW #password").focus();
                }else{
                    exHideIndicator("");
                    popupManager.alert($("[data-lng='nouser']").text(), {
                        title: $("[data-lng='alert']").text(),
                        buttons:[$("[data-lng='confirm']").text()]
                    });
                }
            },
            error: function(errorCode, errorMessage, setting) {
                exHideIndicator("");
                popupManager.alert($("[data-lng='noserver']").text(), {
                  	title: $("[data-lng='alert']").text(),
                  	buttons:[$("[data-lng='confirm']").text()]
                }, function() {
                	M.sys.exit();
                });
            }
        });
	}

    var getPdaLangList = function() {
        networkManager.httpSend({
            server: $("#comp").val(),
        	path: 'api/LanguageList.do',
        	indicator: {show:false},
        	success: function(receivedData, setting) {
        		dataManager.storage('KO',JSON.stringify(receivedData.RESULT.filter(function(rowData){return rowData.LANG_GB =="KO"})))
        		dataManager.storage('EN',JSON.stringify(receivedData.RESULT.filter(function(rowData){return rowData.LANG_GB =="EN"})))
        		dataManager.storage('ES',JSON.stringify(receivedData.RESULT.filter(function(rowData){return rowData.LANG_GB =="ES"})))
        		dataManager.storage('ZH',JSON.stringify(receivedData.RESULT.filter(function(rowData){return rowData.LANG_GB =="ZH"})))
        		exHideIndicator("");
        		screenManager.moveToPage('main.html', { action: 'CLEAR_TOP', animation: "ZOOM_IN" });
        	}
        });
    }

	var ChangePW = function(id, pw) {
	    var IdPw = [];
	    IdPw.push({"ID":id, "PW":pw, "RTN_MSG":""});
        networkManager.httpSend({
            server: $("#comp").val(),
            path: 'api/changePW.do',
            data: {
                'param1': IdPw
            },
            success: function(receivedData, setting) {
                popupManager.instance($("[data-lng='chgpw']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                $("#txtLogPW").val("");
                $("#txtLogPW").focus();
            }
        });
    };

	var loginValidate = function(id, pw) {
    	if (window.Utils.trim(id) == "") {
    	    exHideIndicator("");
    		popupManager.alert($("[data-lng='noid']").text(), {
    			title: $("[data-lng='alert']").text(),
    			buttons:[$("[data-lng='confirm']").text()]
    		}, function() {
    			$("#txtLogID").val("");
    			$("#txtLogID").focus();
    		});
    		return;
    	}

    	if (window.Utils.trim(pw) == "") {
    	    exHideIndicator("");
    		popupManager.alert($("[data-lng='nopw']").text(), {
    			title: $("[data-lng='alert']").text(),
    			buttons:[$("[data-lng='confirm']").text()]
    		}, function() {
    			$("#txtLogPW").val("");
    			$("#txtLogPW").focus();
    		});
    		return;
    	}
    	return true;
    }

    var sessionOut = function(id) {
    	networkManager.httpSend({
    	    server: $("#comp").val(),
    		path: 'api/disconnect.do',
    		data: {
                'user_id': id
            },
    		success: function(receivedData, setting) {
    		    loginProcess();
    		},
    		error: function(){
    			popupManager.instance($("[data-lng='MSG.sessionfail']").text(), {showtime:"LONG"});
    		}
    	});
    };

	var pwKeypad = function(){
		var displayHeight = $(window).outerHeight();
		var displayOriginalHeight = displayHeight;
		var adjHeight = displayOriginalHeight * 0.6;

		$(window).on("resize", function(){
			var changeDefault = $(window).outerHeight();
			if(changeDefault < adjHeight ){
				$("#wrapper.login").css("height", "100%");
			}else{
				$("#wrapper.login").removeAttr("style");
			};
		});
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
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
	popupManager.alert($("[data-lng='quit']").text(), {
		title: $("[data-lng='alert']").text(),
		buttons: [$("[data-lng='cancel']").text(), $("[data-lng='confirm']").text()]
	}, function(index) {
		switch(index) {
			case 0:
				break;
			case 1:
				M.sys.exit();
				break;
		}
	});
});