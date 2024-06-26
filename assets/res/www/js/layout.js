$(document).ready(function(){
// 
	// function calcDeviceHeight(){

	// 	var device_h = $(window).outerHeight(true);
	// 	console.log(device_h);
	// 	$(".fullscreen").css("height", device_h +"px" );

	// 	var header_h = $("#header").height();
	// 	$("main.main").css("height", device_h - header_h + "px");
	// };
	// calcDeviceHeight();

	// // function itemHeight(){}
	// $(window).resize(function(){
	// 	calcDeviceHeight();
	// });
	
	// $(".contents_inner").on("touchstart", function(e){
	// 	$(this).on("touchmove", function(){
	// 		var event = e.originalEvent;
	// 		var movepoint = event.touches[0].screenX;
	// 		// console.log(movepoint);
	// 		var firstpoint = movepoint
	// 		if( firstpoint > movepoint ){
	// 			console.log("swipeleft");
	// 		}else if( firstpoint < movepoint ){
	// 			console.log("swiperight");
	// 		}
			
	// 	})
	// });
	// 000
	function pwKeypad(){
		var displayHeight = $(window).outerHeight();
		var displayOriginalHeight = displayHeight;
		var adjHeight = displayOriginalHeight * 0.6;
		console.log(displayHeight, displayOriginalHeight, adjHeight);
		$(window).on("resize", function(){
			var changeDefault = $(window).outerHeight();
			console.log(changeDefault);
			if(changeDefault < adjHeight ){
				console.log("callKeypad");
				$("#wrapper.login").css("height", "100%");
			}else{
				$("#wrapper.login").removeAttr("style");
			};
		});
	};
	pwKeypad();
	// 001
	$(".onSelect").on("click", function(){
		// console.log("do");
		$(this).siblings("ul").css({
			"height" : "auto",
			"padding" : "1.82vmax 2.396vmax"
		});
	});
	// 004
	$("nav ul li").bind("touchstart", function(){
		// console.log("start");
		$(this).addClass("on");
	});
	$(".btn_callNav").on("click", function(){
		setTimeout(function() {
			$("nav").css("display", "block");
			$("main").addClass("popActive");
		}, 600);
	});
	$("nav .btn_close").on("click", function(){
		$("nav").css("display", "none");
		$("main").removeClass("popActive");
	});
	$(".wall").on("click", function(){
		console.log("area check");
		$(this).css("display", "none");
		$("nav").css("display", "none");
		$(".popup_area").addClass("blind");
		$("main").removeClass("popActive");
	});
	// $(document).on("mouseup, touchend", function(e){
	// 	var nav = $("nav");
	// 	if (nav.css("display") == "block" && nav.has(e.target).length == 0){
	// 		console.log("cdit");
	// 		nav.hide();
	// 		$("main").delay(3000).removeClass("popActive");
	// 	};
	// });
	// $(document).on("mouseup, touchend", function(e){
	// 	var nav =$("#header nav");
	// 	if(nav.css("display") == "block" && nav.has(e.target).length == 0 )
	// 	// if(e.target.className == "nav"){return false}
	// 		console.log("nav close");
	// 		$("main").removeClass("popActive");
	// 		nav.css("display", "none");
	// });
	$(document).on("click", function(e){
		$("nav").each(function(){
			if( $(this).css("display") == "block" ){
				var l_position = $(this).offset();
				l_position.right = parseInt(l_position.left) + ($(this).width());
				l_position.bottom = parseInt(l_position.top) + parseInt($(this).height());
				if( (l_position.left <= e.pageX && e.pageX <= l_position.right) && (l_position.top <= e.pageY && e.pageY <= l_position.bottom) ){
					console.log("in click");
				}else{
					console.log("out click");
					$(this).css("display","none");
					$("main").removeClass("popActive");
				}
			}	
		});

		$(".layerPop").each(function(){
			if( $(this).css("display") == "block" ){
				var l_position = $(this).offset();
				l_position.right = parseInt(l_position.left) + ($(this).width());
				l_position.bottom = parseInt(l_position.top) + parseInt($(this).height());
				if( (l_position.left <= e.pageX && e.pageX <= l_position.right) && (l_position.top <= e.pageY && e.pageY <= l_position.bottom) ){
					console.log("in click");
				}else{
					console.log("out click");
					$(".layerPop").addClass("blind");
					$("main").removeClass("popActive");
				}
			}	
		});
	});
	// 005
	$(".btn_chk").on("click", function(){
		$(this).toggleClass("checked");
		if( $(this).hasClass("checked") ){
			$(this).children().find("input").attr("checked", "checked");
		}else{
			$(this).children().find("input").removeAttr("checked");
		}
	});
	$(".pushList").on("click", ".havDep", function(){
		$(this).toggleClass("expand");
		$(this).siblings("ul").toggleClass("expand");
	});
	$(".pushList").on("click", "div > ul > li:nth-child(2) > ul > li > span", function(){
		$(".layerPop").removeClass("blind");
		$("main").addClass("popActive");
	});
	// 008
	$(".moreArea").on("click", function(){
		$(this).toggleClass("expand");
		$(this).siblings(".box_inner").toggleClass("expand");
	});
	// 011
	$(".pop_cont .rolling_area li").on("click", function(){
		$(this).addClass("on").attr("id","target");
		$(this).siblings("li").removeClass("on").removeAttr("id");
	});
	// 039
	$(".upload_images").on("click", ".imageBox > span", function(){
		$(".upImage").removeClass("blind");
		$("main").addClass("popActive");
		if( $(this).parent().hasClass("nonImg") ){
			console.log("noItem");
			$(".pop_cont_head").find(".haveItem").addClass("blind");			// 팝업 타이틀 변경
			$(".pop_cont_head > span:not(.haveItem)").removeClass("blind");
			$(".upImage .btn_area > p:not(.haveItem)").removeClass("blind");	// 팝업 버튼 변경
			$(".upImage .btn_area").find(".haveItem").addClass("blind");
			$(".apArea_image").children("span").addClass("blind");			// 팝업 컨텐츠 변경
			$(".apArea_image").find(".comment_for").removeClass("blind");
		}else{
			console.log("inItem");
			$(".pop_cont_head > span:not(.haveItem)").addClass("blind");	// 팝업 타이틀 변경
			$(".pop_cont_head").find(".haveItem").removeClass("blind");
			$(".upImage .btn_area > p:not(.haveItem)").addClass("blind");	// 팝업 버튼 변경
			$(".upImage .btn_area").find(".haveItem").removeClass("blind");
			$(".apArea_image").children("span").removeClass("blind");		// 팝업 컨텐츠 변경
			$(".apArea_image").find(".comment_for").addClass("blind");
		};
	});
	$(".btn_popClose").on("click", function(){
		$(".wall").css("display", "none");
		$(".upImage").addClass("blind");
		$("main").removeClass("popActive");
	});
/* 이 행부터 123행 까지 탭*/
// common
	// back to top
	$(".btn_btTop").on("click", function(){
		$("body").stop(true, false).animate({
			scrollTop : 0
		}, 500);
	});
	// tabmenu
	$(".tabmenu > div > h4").on("click", function(){
		console.log("tap");
		$(this).addClass("on");
		$(this).siblings("h4").removeClass("on");
		var p = $(this).index();
		if( p == 0 ){
			console.log("s1");
			$(".contents_inner").css("transform", "translateX(0%)");
			$(".contents_inner").children("section").first().css("height", "auto");
			$(".contents_inner").children("section").last().css("height", "0");
			$(".btn_sec1").removeClass("blind");
			$(".btn_sec2").addClass("blind");
		}else if ( p == 1){
			console.log("s2");
			$(".contents_inner").css("transform", "translateX(-50%)");
			$(".contents_inner").children("section").first().css("height", "0");
			$(".contents_inner").children("section").last().css("height", "auto");
			$(".btn_sec2").removeClass("blind");
			$(".btn_sec1").addClass("blind");
		};
	});
	if($(".tabmenu > div > h4").hasClass("on")){	// 초기화면 리셋
		var p = $(".tabmenu > div > h4").index();
		if( p == 0 ){
			console.log("s1");
			$(".contents_inner").css("transform", "translateX(0%)");
			$(".contents_inner").children("section").first().css("height", "auto");
			$(".contents_inner").children("section").last().css("height", "0");
			$(".btn_sec1").removeClass("blind");
			$(".btn_sec2").addClass("blind");
		}else if ( p == 1){
			console.log("s2");
			$(".contents_inner").css("transform", "translateX(-50%)");
			$(".contents_inner").children("section").first().css("height", "0");
			$(".contents_inner").children("section").last().css("height", "auto");
			$(".btn_sec2").removeClass("blind");
			$(".btn_sec1").addClass("blind");
		};
	}
	// swipe
	function swipe(){

		window.addEventListener('touchstart', function(event) {
			var touch = event.touches[0];
			touchstartX = touch.clientX;
			touchstartY = touch.clientY;
		}, false);
		 
		window.addEventListener('touchend', function(event) {
			if(event.touches.length == 0) {
				var touch = event.changedTouches[event.changedTouches.length - 1];
				touchendX = touch.clientX;
				touchendY = touch.clientY;

				touchoffsetX = touchendX - touchstartX;
				touchoffsetY = touchendY - touchstartY;

			if(Math.abs(touchoffsetX) >= 20 && Math.abs(touchoffsetY) <= 10) {
				if(touchoffsetX < 0)
					// alert("swipe left");
					$(".contents_inner").css("transform", "translateX(-50%)"),
					$(".contents_inner").children("section").first().css("height", "0"),
					$(".contents_inner").children("section").last().css("height", "auto"),
					$(".tabmenu h4").last().addClass("on"),
					$(".tabmenu h4").first().removeClass("on"),
					$(".btn_sec2").removeClass("blind"),
					$(".btn_sec1").addClass("blind");
				else
					// alert("swipe right");
					$(".contents_inner").css("transform", "translateX(0%)"),
					$(".contents_inner").children("section").first().css("height", "auto"),
					$(".contents_inner").children("section").last().css("height", "0"),
					$(".tabmenu h4").first().addClass("on"),
					$(".tabmenu h4").last().removeClass("on"),
					$(".btn_sec1").removeClass("blind"),
					$(".btn_sec2").addClass("blind");
				}
			}
		}, false);
	};
	// 조회 결과 항목 선택
	$(".tableList").on("click", ".tableCont", function(){
		$(this).addClass("on");
		$(this).siblings("div").removeClass("on");
	});
	$(".list").on("click", " table tbody tr", function(){
		$(this).addClass("on");
		$(this).siblings("tr").removeClass("on");
	});
	// optionbox popup
	$("main").on("click", ".btn_callPage, .inputBox > span > label, .btn_callPop, .searchBox > p > span, .btn_regForm", function(){
		console.log("open");
		$(".layerPop").removeClass("blind");
		$("main").addClass("popActive");
		// H_T_UM011 주석 이하의 section이 있어야 에러로 지목되지 않고 이벤트가 정상적으로 발생.
		// var focusPoint = document.getElementById("target");
		// focusPoint.scrollIntoView();
	});
	// var obj = $(".rolling_area").find(".on");
	// var obj_top = obj.offset().top;
	// var obj_height = obj.innerHeight();
	// var obj_bottom = obj_top + obj_height;
	// var adjPoint = parseInt(obj_bottom) / 2;
	// console.log("open :" + obj_top);
	// $(".rolling_area").animate({
	// 	scrollTop : obj_top
	// }, 400);

	// close popup
	$(".popup_area").on("click", ".btn_area p:not(.nonClose) button", function(){
		$(".wall").css("display", "none");
		$(".popup_area").addClass("blind");
		$("main").removeClass("popActive");

		if( $(".popup_area").hasClass("upImage") ){
			console.log("imgpop");
			var page_h = $(window).height();
			$(window).scrollTop(page_h);
		}else if( $(".popup_area").hasClass("intSearch") ){
			console.log("intSearch");
			var tcElemPoint = $(".searchBox").offset().top;
			var tcAdjPoint = tcElemPoint + $(".searchBox").outerHeight(true);
			$(window).scrollTop(tcAdjPoint);
		}
	});
	// $(document).on("click", function(e){
	// 	var layer =$(".popup_area");
	// 	if( layer.has(e.target).length == 0 ){
	// 		console.log("error");
	// 		layer.addClass("blind"),
	// 		$("main").removeClass("popActive");
	// 	}
	// });
	// nav 
	// $(document).ready(function(){
		// var device_h = $(window).outerHeight(true);
		// var device_top = $(window).scrollTop();
		// var device_bottom = device_top + device_h;
		// console.log("device_value : "+ device_h, device_top, device_bottom);
		// $("section:not(.layerPop)").each(function(index){
		// 	var elem = $("section:not(.layerPop)").eq(index).children().find(".tableList");
		// 	var elem_h = elem.outerHeight(true);
		// 	var elem_top = elem.offset().top;
		// 	var elem_bottom = elem_top + elem_h;


		// 	if ( index == 0 ){
		// 		console.log(elem_h, elem_top, elem_bottom);
		// 		if( elem_bottom >= device_bottom ){
		// 			console.log("section1 over")
		// 		}else{
		// 			console.log("section1 not_yet")
		// 		};
		// 	}else if( index == 1 ){
		// 		console.log(elem_h, elem_top, elem_bottom);
		// 		if( elem_bottom >= device_bottom ){
		// 			console.log("section2 over")
		// 			elem.siblings(".btn_area").css({
		// 				"position":"fixed"
		// 			});
		// 		}else{
		// 			console.log("section2 not_yet")
		// 		};
		// 	}
		// });
	// });
});
// mobile event
// $(document).on("pagecreate", function(){
// 	console.log("set complete");
	
// 	
// 	// tabmenu swipe n tap
// 	$(".tabmenu > div > h4").on("tap", function(){
// 		console.log("tap");
// 		$(this).addClass("on");
// 		$(this).siblings("h4").removeClass("on");
// 		var p = $(this).index();
// 		var target = $(".contents_inner > section").eq(p)
// 		target.removeClass("blind");
// 		target.siblings("section").addClass("blind");
// 		moreAutoreset();
// 	});

// 	$(".tabmenu > div > h4").on("swiperight", function(){
// 		// e.preventDefault();
// 		console.log("swiperight");
// 		var p = $(this).index();
// 		var target = $(".contents_inner > section").eq(p);
// 		var adj_p = $(this).index() + 1;
// 		var maxlength = $(".contents_inner > section").length;
// 		// console.log(p, maxlength);

// 		if ( adj_p < maxlength ){
// 			$(this).removeClass("on");
// 			$(this).next("h4").addClass("on");
// 			target.addClass("blind");
// 			target.next("section").removeClass("blind");
// 			moreAutoreset();
// 		}else{
			
// 		};
// 	});

// 	$(".tabmenu > div > h4").on("swiperleft", function(){
// 		// e.preventDefault();
// 		console.log("swiperleft");
// 		var p = $(this).index();
// 		var target = $(".contents_inner > section").eq(p);
// 		var adj_p = $(this).index() + 1;
// 		var maxlength = $(".contents_inner > section").length;

// 		if ( adj_p > 0 ){
// 			$(this).removeClass("on");
// 			$(this).prev("h4").addClass("on");
// 			target.addClass("blind");
// 			target.prev("section").removeClass("blind");
// 			moreAutoreset();
// 		}else{
			
// 		};
// 	});
// });