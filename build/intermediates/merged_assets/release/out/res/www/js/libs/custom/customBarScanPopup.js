function ScanBarPopup(opts){
	var templatePop = "<section class=\"popup_area blind\" id=\"{{ID}}\">"
						+"<div class=\"container\">"
							+"<div class=\"pop_cont\">"
							    +"<p class=\"pop_cont_head\"><span>{{TITLE}}</span></p>"
								+"<div class=\"box_inner\">"
								    +"<div class=\"opt_input\">"
                                        +"<p class=\"lineHead\">{{LABEL}}</p>"
                                        +"<p class=\"inputBox\" style=\"width:60%;height:24px;background-color:#fff; border:1px solid #666;\"><span><input type=\"text\" id=\"inputScan2\" value=\"\"><label style=\"left:105%;\"><i class=\"material-icons\" id=\"btnScan2\">camera</i></label></span></p>"
                                    +"</div>"
								+"</div>"
								+"<div class=\"btn_area\">"
									+"<p class=\"classicalBtn adjColor\"><button type=\"submit\" class=\"btn_confirm\">확인</button></p>"
									+"<p class=\"classicalBtn\"><button type=\"button\" class=\"btn_cancel\">취소</button></p>"
								+"</div>"
							+"</div>"
						+"</div>"
					+"</section>"
	var title = opts.title;
	var today = new Date();
	var id = opts.id == undefined ? "selPop" + today.getMilliseconds() : opts.id;
	var label = opts.label == undefined ? "" : opts.label;
	var type = opts.type == undefined ? "Text" : opts.type;
	var value = opts.value == undefined ? "Text" : opts.value;
	var objBtn = opts.btnObj;
	var thisObj = this;
	var okCallback = opts.submitCallback;
	var selectDataCode = "";
	var goBottom = opts.goBottom == undefined ? false : opts.goBottom;

	this.setSelectCode = function(selCode) {
		selectDataCode = selCode;
	};

	this.init = function() {
		selectDataCode = "";
		if (objBtn != undefined)
			objBtn.on("click", thisObj.show);
		templatePop = templatePop.replace(/\{\{\TITLE\}\}/, title)
						.replace(/\{\{\ID\}\}/, id)
						.replace(/\{\{\LABEL\}\}/, label);
		$("body").append(templatePop);

		$("#inputScan2").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                var val = inputScan;

                if(val.trim() == null || val.trim() == "undefined" || val.trim() == "" ){
                    popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"});
                    return;
                }

                console.log("val : "+ val);

                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    console.log("스캔됨");
                }else{
                    $("#inputScan2").focus();
                    return;
                }
                okCallback(val);
                thisObj.hide();
            }
        });

		$("#" + id).on("click", ".btn_area .btn_confirm", function(){
            var val = $("#" + id + " .pop_cont input").val();

            if(val.trim() == null || val.trim() == "undefined" || val.trim() == "" ){
                popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"});
                return;
            }

            console.log("val : "+ val);

			okCallback(val);
			thisObj.hide();
		});

		$("#" + id).on("click", ".btn_area .btn_cancel", function(){
		    var val = "cancel";
			okCallback(val);
            thisObj.hide();
		});

		// 팝업 스캔 가상키보드 처리
        $("#inputScan2").unbind("focus").on("focus", function(event) {
            console.log("inputScan2 focus");
            var id = $(this).attr("id");

            $(this).attr("readonly",true);
            setTimeout(function() {
                $("#"+id).attr("readonly",false);
            },10)
        })
        $("#inputScan2").on("click", function(event) {
            console.log("inputScan2 focus");
            var id = $(this).attr("id");

            $(this).attr("readonly",true);
            setTimeout(function() {
                $("#"+id).attr("readonly",false);
            },10)
        })

        // 팝업 카메라 버튼 클릭 시
        $("#btnScan2").on("click", screenScan2);
	};

	this.setDB = function(data, code, name) {
    	var tag = "";
    	$("#" + id + " .select_area").html("");
    	$.each(data, function(index,rowData){
    	    if(eval("rowData."+code) != optionManager.getLGORT()){
    	        tag += "<option value='" +  eval("rowData."+code) + "'>" + eval("rowData."+name) + "</option>";
    	    }
    	});
    	$("#" + id + " .select_area").append(tag);
    };

	this.show = function() {
	    $("#" + id + " .pop_cont input").val("");
		$("#" + id).removeClass("blind");
		$("main").addClass("popActive");
	};

	this.hide = function() {
		$("#" + id).addClass("blind");
		$("#" + id).remove();
		$("main").removeClass("popActive");

		if (goBottom)
			$(window).scrollTop($(window).height());
	};

	this.clear = function() {
		$("#" + id).remove();
	};

	// 팝업 스캔 카메라 처리 함수
    var screenScan2 = function() {
        M.plugin('qr').open(function(rst) {
            if (rst.status == 'SUCCESS') {
                var qr_data = rst.result;
                // TODO : success code here
                //console.log(qr_data);
                var e = jQuery.Event( "keypress", { keyCode: 13 } );
                $("#inputScan2").val(qr_data);
                $("#inputScan2").focus();
                $("#inputScan2").trigger(e);
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

}