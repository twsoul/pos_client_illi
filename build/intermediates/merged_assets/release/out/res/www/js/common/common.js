
/**
 * Android, iOS 기본 공통처리를 진행한다
 */
(function(window, document, M, $, undefined) {

	var topBtn = $('.btn_btTop'),
		defaultOuterHeight = window.outerHeight,
		defaultWindowHeight = $(window).height(),
		footerRemoveTimer = undefined,
		headerRemoveTimer = undefined,
		topBtnRemoveTimer = undefined,
		deviceInfo = M.info.device();



	var BoxBarUpper = function(scan) {
	    var barcode = scan;
        if(getUPPER == "Y"){
           barcode = barcode.toUpperCase();
        }
        return barcode;
    };

	//topBtn.addClass('none');

    var screenScan = function() {
            M.plugin('qr').open(function(rst) {
            	if (rst.status == 'SUCCESS') {
            		var qr_data = rst.result;
        	    	// TODO : success code here
        	    	//console.log(qr_data);
        	    	var e = jQuery.Event( "keypress", { keyCode: 13 } );
            		$("#inputScan").val(qr_data);
            		$("#inputScan").focus();
            		$("#inputScan").trigger(e);
                } else {
        	    	// TODO: cancel or fail code here
        	    }
            }, {
                	'cancel' : '이전',
                	'custom' : '',
                	'customHtml' : '',
                	'flashOn' : 'Flash ON',
                	'flashOff' : 'Flash OFF',
                	'menuAnimation' : 'ON', // ON, OFF
            });
    };

    $("#btnScan").on("click", screenScan);

	$(".moreArea").on("click", function(){
    	$(this).toggleClass("expand");
    	$(this).siblings(".box_inner").toggleClass("expand");
    });
    $(".moreArea2").on("click", function(){
        $(".moreArea").toggleClass("expand");
        $(".moreArea").siblings(".box_inner").toggleClass("expand");
    });

	$('input').attr('autocorrect', 'off');
	$('input').attr('autocapitalize', 'off');
	//alert("height : " + $(window).outerHeight(true));
	//$('body').height($('body').height() + 1);
	//$('body').height($('body').height() - 1);

	/*$("#header nav ul li").bind("touchstart", function(){
		// console.log("start");
		$(this).addClass("on");
	});*/
	$(".btn_callNav").on("click", function(){
    	screenManager.moveToPage("../common/allmenu.html", { action: 'NO_HISTORY', animation: "SLIDE_TOP" });
    });

    $("#footer > ul > li > button").on("click", function(){
    	var page = $(this).data("value");
    	if (page != ""){
    	    if (page == "../common/allmenu.html"){
    	         var url = window.location.href;
                 screenManager.moveToPage(page, { action: 'NO_HISTORY', animation: "SLIDE_TOP", param: {url: M.sec.encrypt(url).result} });
             } else if (page == "../common/main.html") {
                 screenManager.replaceToPage(page);
             } else {
                 screenManager.moveToPage(page, { animation: "SLIDE_TOP" });
             }
    	}
    });

	/*$(".btn_callNav").on("click", function(){
		setTimeout(function() {
			$("#header nav").css("display", "block");
			$("main").addClass("popActive");
		}, 600);
	});*/
	$("nav .btn_close").on("click", function(){
		$("#header nav").css("display", "none");
	});
	$("nav .btn_home").on("click", function(){
		var pagelist = M.info.stack();
		var tcount = pagelist.length;
		$("#header nav").css("display", "none");
		if (tcount > 2){
			for (var i = 1; i <= tcount-2;i++){
				M.page.remove(pagelist[tcount-i].key);
			}
			screenManager.moveToBack();
		} else {
			screenManager.moveToBack();
		}
	});
	$(document).on("click", function(e){
		var nav = $("nav");
		if (nav.css("display") == "block" && nav.has(e.target).length == 0){
			nav.hide();
			$("main").removeClass("popActive");
		};
	});
	
	var m_gate_in = dataManager.storage("GATE_IN");
	if (m_gate_in == "KD"){
		$("#navMenu li:eq(1)").addClass("blind");
	}
//	else if (m_gate_in == "TLS"){
//        $("#navMenu li:eq(5)").addClass("blind");
//    }

	$("#navMenu li").on("click", function(){
		var pageId = $(this).data("id");
		var db_kind = dataManager.storage('saveUserDb') ;
		var page = "";
		if (pageId != "" && pageId != undefined){
			switch(pageId){
			case 1:
				if (m_gate_in == "GCS") {
					page = "/www/html/H_T_UM_008.html";
				}
				else if (m_gate_in == "TLS") {
					page = "/www/html/H_D_UM_008.html";
				}
				else if (m_gate_in == "KD") {
					page = "/www/html/H_T_UM_058.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "TLS") {
					page = "/www/html/H_D_UM_045.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "GCS") {
					page = "/www/html/H_T_UM_045.html";
				}
				else {
					page = "/www/html/H_T_UM_080.html";
				}
				break;
			case 2:
				if (m_gate_in == "GCS"){
					page = "/www/html/H_T_UM_020.html";
				}
				else if (m_gate_in == "TLS") {
					page = "/www/html/H_D_UM_020.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "TLS") {
					page = "/www/html/H_D_UM_047.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "GCS") {
					page = "/www/html/H_T_UM_047.html";
				}
				else {
					page = "/www/html/H_T_UM_089.html";
				}
				break;
			case 3:
				if (m_gate_in == "GCS"){
					page = "/www/html/H_T_UM_025.html";
				}
				else if (m_gate_in == "TLS") {
					page = "/www/html/H_D_UM_025.html";
				}
				else if (m_gate_in == "KD") {
					page = "/www/html/H_T_UM_061.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "TLS") {
					page = "/www/html/H_D_UM_049.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "GCS") {
					page = "/www/html/H_T_UM_049.html";
				}
				else {
					page = "/www/html/H_T_UM_094.html";
				}
				break;
			case 4:
				if (m_gate_in == "GCS"){
					page = "/www/html/H_T_UM_030.html";
				}
				else if (m_gate_in == "TLS") {
					page = "/www/html/H_D_UM_030.html";
				}
				else if (m_gate_in == "KD") {
					page = "/www/html/H_T_UM_065.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "TLS") {
					page = "/www/html/H_D_UM_052.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "GCS") {
					page = "/www/html/H_T_UM_052.html";
				}
				else {
					page = "/www/html/H_T_UM_097.html";
				}
				break;
			case 5:
				if (m_gate_in == "GCS"){
					page = "/www/html/H_T_UM_033.html";
				}
				else if (m_gate_in == "TLS") {
					page = "/www/html/H_D_UM_033.html";
				}
				else if (m_gate_in == "KD") {
					page = "/www/html/H_T_UM_069.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "TLS") {
					page = "/www/html/H_D_UM_055.html";
				}
				else if (m_gate_in == "COUT" && db_kind == "GCS") {
					page = "/www/html/H_T_UM_055.html";
				}
				else {
					page = "/www/html/H_T_UM_101.html";
				}
				break;
			case 6:
				if (m_gate_in == "GCS"){
					page = "/www/html/H_T_UM_040.html";
				}
				else if (m_gate_in == "TLS") {
					page = "/www/html/H_D_UM_040.html";
				}
				else if (m_gate_in == "KD") {
					page = "/www/html/H_T_UM_040.html";
				}
				else {
					page = "/www/html/H_T_UM_102.html";
				}
				break;
			case 7:
				page = "/www/html/H_T_UM_005.html";
				break;
			default:
				page = "logout";
				break;
			}
			if (page == "logout"){
				popupManager.alert('로그아웃 하시겠습니까?', {
					title: '로그아웃',
					buttons: ['예', '아니오']
				}, function(index) {
					if (index == 0){
//		                exWNStopGPSInfo();
						userManager.removeUserData();
				        sessionOut();
					}
				});
			} else {
				if (pageId == 7){
					$("#header nav").css("display", "none");
					screenManager.moveToPage(page);
				} else {
					var pagelist = M.info.stack();
					var tcount = pagelist.length;
					$("#header nav").css("display", "none");
					if (tcount > 2){
						for (var i = 1; i <= tcount-2;i++){
							M.page.remove(pagelist[tcount-i].key);
						}
						if (wnIf.device == DT_ANDROID) {
							M.page.replace(page);
						} else {
							M.page.replace("/res" + page);
						}
					} else {
						screenManager.moveToPage(page);
					}
				}
			}
		}
	});
	
	$("#btn_back").on("click", function(){
		page.moveToBack();
	});

	topBtn.click(function() {
		$(window).scrollTop(0);
		topBtn.addClass('none');
	});


	var sessionOut = function() {
    		networkManager.httpSend({
    			path: 'api/logout.do',
    			data: {},
    			success: function(receivedData, setting) {
                    screenManager.moveToPage('../common/login.html', { animation:"SLIDE_RIGHT", action: 'CLEAR_TOP' });
                    popupManager.instance("로그아웃 되었습니다", {showtime:"LONG"});
    			},
    			error: function(){
    				popupManager.instance("로그아웃 중 에러가 발생했습니다.", {showtime:"LONG"});
    			}
    		});
    	};
	
	var calcDeviceHeight = function(){
		var device_h = $(window).outerHeight(true);
		var header_h = $("#header").height();
		$("main.main").css("height", device_h - header_h + "px");
	};
	calcDeviceHeight();

	// function itemHeight(){}
	$(window).resize(function(){
		calcDeviceHeight();
	});

	/**
	 * 버튼에 touchstart, touchend 이벤트 발생 시 on 클래스를 넣어준다
	 * 아래와 같이 할 경우 js에서 html() 메서드를 이용해서 넣어준 button 에도 이벤트가 걸리게된다.
	 */
	$(document).on('touchstart', 'button:not([data-not-touch])', function() {
		$(this).addClass('on');
	});

	$(document).on('touchmove touchend', 'button:not([data-not-touch])', function() {
		$(this).removeClass('on');
	});

	/**
	 * 키보드가 올라오거나 내려올떄 발생한다
 	 */
	$(window).on('resize', function() {
		setTimeout(function() {
			if ( window.outerHeight === defaultOuterHeight && $(window).height() == defaultWindowHeight) {
				$('input:focus').blur();

				var isNotRemoveFooter = ($('footer').data('isNotRemoveFooter') === true) ? true : false;

				if ( !isNotRemoveFooter ) {
					$('footer').removeClass('none');
				}

				// OS 버그로 인해 화면이 제대로 갱신되지 않아 아래와 같이 처리한다.
				$(window).height($(window).height() + 1);
				$(window).height($(window).height() - 1);
			}
		}, 0);
	});

	/**
	 * iOS header fixed 처리
	 *
	 * iOS의 경우 header fixed처리가 정상적으로 이루어지지 않는다(OS버그)
	 * 상황별로 틀리지만, 아래와 같이 header를 복사하는 방법을 이용할 수 있다.
 	 */
	if ( deviceInfo.os.name == 'iPhone OS' ) {
		if($('header') && $('.main').length < 1) {

			$('header').parent().append('<div class="header_bg"></div>');

			$('.header_bg').html($('header').html());

			$(document).on('focus', 'input, textarea', function() {
				logger.info('KHW', 'focus');
				if ( headerRemoveTimer ) {
					headerRemoveTimer = clearTimeout(headerRemoveTimer);
					headerRemoveTimer = undefined;
				}
				$('header').css('position','absolute');
			});

			$(document).on('blur', 'input, textarea', function() {
				headerRemoveTimer = setTimeout(function() {
					$('header').css('position', 'fixed');
					$(window).scrollTop($(window).scrollTop() + 1);
				}, 600);
			});
		}
	}

	// Input focus 시 readonly일 경우 blur처리
	$(document).on('focus', 'input, textarea', function() {
		if ( $(this).prop('readonly') ) {
			$(this).blur();
			return;
		}

		var type = $(this).prop('type');

		// checkbox, radio는 푸터가 올라오지 않는다.
		switch(type) {
			case 'checkbox':
			case 'radio':
				return;
				break;
		}

		if ( footerRemoveTimer ) {
			footerRemoveTimer = clearTimeout(footerRemoveTimer);
			footerRemoveTimer = undefined;
		}

		$('footer').addClass('none');
	});

	// input blur 시 footer visible 처리
	$(document).on('blur', 'input, textarea', function() {
		var isNotRemoveFooter = ($('footer').data('isNotRemoveFooter') === true) ? true : false;
		if ( isNotRemoveFooter ) {
			return;
		}

		// iOS 시점문제로 인해 setTimeout을 준다
		if ( deviceInfo.os.name == 'iPhone OS' ) {
			footerRemoveTimer = setTimeout(function() {
				$('footer').removeClass('none');
				$(window).scrollTop($(window).scrollTop() - 1);
			}, 600);
		} else if ( deviceInfo.os.name == 'pc' ) {
			$('footer').removeClass('none');
		}
	});

    exShowIndicator("");
    var LNG = "";
    try{
        LNG = optionManager.getLNG();
        if(LNG == "" || LNG == null || LNG == undefined){LNG = "EN"};
    } catch(e) {
        LNG = "EN"
    }
    if(dataManager.storage(LNG) != ""){
        $.each(JSON.parse(dataManager.storage(LNG)), function(index,rowData) {
            $("[data-lng='"+rowData.MSG_TYPE+"."+rowData.LANG_KEY+"']").text(rowData.MSG_DESC);
        });
    }
    exHideIndicator("");

    $("#inputScan").focus();

	$("#inputScan").unbind("focus").on("focus", function(event) {
	    var id = $(this).attr("id");

	    $(this).attr("readonly",true);
	    setTimeout(function() {
	        $("#"+id).attr("readonly",false);
	    },10)
	})

	$("#inputScan").on("click", function(event) {
        var id = $(this).attr("id");

        $(this).attr("readonly",true);
        setTimeout(function() {
            $("#"+id).attr("readonly",false);
        },10)
    })

    var model = exWNDeviceInfo();
    $(window).on('keydown', function (e) {
        if(model == "CT40" || model == "PM80"){
            //console.log("This device is "+model);
            if(e.keyCode === 0){
                e.preventDefault();
                $("#inputScan").focus();
            }
        }
    });

    /*$("#inputScan").on("focusin", function(){
        $(this).css("background","green")
        console.log("+++++++++++++++focusin+++++++++++++++")
    });
    $("#inputScan").on("focusout", function(){
        $(this).css("background","red")
        console.log("+++++++++++++++focusout+++++++++++++++")
    }); //-> 포커스가 이벤트 대*/

})(window, document, M, $);