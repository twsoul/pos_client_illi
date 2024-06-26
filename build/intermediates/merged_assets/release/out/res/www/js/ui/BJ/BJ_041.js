/*******************************************************************
*	페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var EQ_NO="";
    var STATUS="";
    var DATE="";
    var DATEL="";
    var CHECK_LIST="";
    var PART_LOC="";
    var PART_NM="";
    var MEAS="";
    var arri_dtst="";
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getARBPL = "";
    var getZPROC = optionManager.getZPROC();
    var getLNG = optionManager.getLNG();
    var getTEST = optionManager.getTEST();

	// 화면 초기화
	var setInitScreen = function() {
	    getARBPL = dataManager.param("ARBPL");
	    EQ_NO = dataManager.param("EQ_NO");
	    STATUS = dataManager.param("STATUS");
	    DATE = dataManager.param("DATE");
	    DATEL = dataManager.param("DATEL");
	    CHECK_LIST = dataManager.param("CHECK_LIST");
	    PART_LOC = dataManager.param("PART_LOC");
	    PART_NM = dataManager.param("PART_NM");
	    MEAS = dataManager.param("MEASURE");
	    arri_dtst = window.Utils.replaceAll(DATE,"-", "");
	    $("#txtAUFNR").text(EQ_NO);
	    $("#txtTDATE").text(window.Utils.getTodayFormat("yyyy.MM.dd HH:mm:ss"));
	    $("#txtSTATUS").text(STATUS);
	    $("#txtDATE").text(DATE);
	    $("#txtDATEL").text(DATEL);
	    $("#txtCHECK_LIST").text(CHECK_LIST);
	    $("#txtPART_LOC").text(PART_LOC);
	    $("#txtPART_NM").text(PART_NM);
	    getSearchList();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
	    // 저장 버튼 클릭 시
	    $("#btnSave").on("click",  setSave);
	};

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
	};

    // 단위정보 반올림 계산 함수
	var inputEvent = function() {
	    $("#list_bj_041 .USE04").on("change", function() {
	        var ANDEC = parseInt($(this).find("option:selected").data("andec"));
	        var OG = $(this).parent().parent().parent().find(".READC").val();
	        $(this).parent().parent().parent().find(".READC").val(parseFloat(OG).toFixed(ANDEC));
	    });
        $("#list_bj_041 .READC").on("blur", function() {
            var ANDEC = parseInt($(this).parent().parent().find(".USE04 option:selected").data("andec"));
            $(this).val(parseFloat($(this).val()).toFixed(ANDEC));
        });
    };

    // 저장 확인 함수
	var setSave = function() {
    	popupManager.alert($("[data-lng='MSG.0000000172']").text(), {
            title: $("[data-lng='MSG.0000000004']").text(),
            buttons: [$("[data-lng='MSG.0000000003']").text(), $("[data-lng='MSG.0000000002']").text()]
    	}, function(index) {
    		switch(index) {
    			case 0:
    				break;
    			case 1:
    				saveSearchList();
    				break;
    		}
    	});
    };

	// 내부 DB 예방정보 아이템 SELECT 함수
	var getSearchList = function(){
	    var query = 'SELECT A.VORNR, A.LTXA1, A.USR00, A.USR04, A.USR05, IFNULL(A.USE04,"") AS USE04, A.USEYN, A.USR04, A.USR01, IFNULL(A.READC,"") AS READC, IFNULL(A.OK,"") AS OK, IFNULL(B.MSEH6,"") AS MSEH6 FROM PVNT A LEFT OUTER JOIN MEAS B ON (B.SPRAS = "'+getLNG+'" AND B.MSEHI = A.USEYN AND B.TEST = A.TEST) WHERE WERKS = "'+getWERKS+'" AND GSTRP = "'+arri_dtst+'" AND ARBPL = "'+getARBPL+'" AND ZPROC = "'+getZPROC+'" AND AUFNR = "'+EQ_NO+'" AND A.TEST = "'+getTEST+'"';
        M.db.execute(getUSER_ID, query, function(status, result,  name) {
            if(status == "FAIL" || result.row_count < 1) {
                popupManager.instance($("[data-lng='MSG.0000000153']").text(), {showtime:"LONG"});
                page.moveToBack();
            } else {
                selectTABLE(result);
            }
        });
	};

    // 내부 DB 예방정보 아이템 데이터 표현 함수
	var selectTABLE = function(data) {
        var tag = "";
        var template = $("#ListTemplate").html();
        $.each(data.row_list, function(index,rowData){
            tag += template.replace(/\{\{NUM\}\}/gi, index+1)
                		   .replace(/\{\{VORNR\}\}/gi, rowData.VORNR)
                		   .replace(/\{\{LTXA1\}\}/, rowData.LTXA1)
                		   .replace(/\{\{USR00\}\}/, rowData.USR00)
                		   .replace(/\{\{USR04\}\}/, rowData.USR04)
                		   .replace(/\{\{USR05\}\}/, rowData.USR05)
                		   .replace(/\{\{USE04\}\}/, rowData.USE04)
                		   .replace(/\{\{USEYN\}\}/, rowData.USEYN)
                		   .replace(/\{\{USE\}\}/gi, rowData.MSEH6)
                		   .replace(/\{\{USR04\}\}/, rowData.USR04)
                		   .replace(/\{\{USR01\}\}/, rowData.USR01)
                		   .replace(/\{\{READC\}\}/, rowData.READC)
                		   .replace(/\{\{MEAS\}\}/, MEAS)
                		   .replace(/\{\{OK\}\}/, rowData.OK)
                		   .replace(/\{\{LB0000000183\}\}/,  $("[data-lng='LB.0000000183']").text())
                           .replace(/\{\{LB0000000184\}\}/,  $("[data-lng='LB.0000000184']").text())
                           .replace(/\{\{LB0000000185\}\}/,  $("[data-lng='LB.0000000185']").text())
                           .replace(/\{\{LB0000000186\}\}/,  $("[data-lng='LB.0000000186']").text())
                           .replace(/\{\{LB0000000187\}\}/,  $("[data-lng='LB.0000000187']").text())
                           .replace(/\{\{LB0000000188\}\}/,  $("[data-lng='LB.0000000188']").text());
        });
        $("#list_bj_041").append(tag);
        setInput();
        inputEvent();
    };

    // 입력값 제어 함수
	var setInput = function() {
	    $("#list_bj_041 .tableCont").each(function() {
            if($(this).data("useyn") != "" && $(this).data("useyn") != "undefined" && $(this).data("useyn") != null){
                $(this).find(".USE04").val($(this).data("useyn")).prop("selected", true);
                $(this).find(".USE04").attr("disabled","disabled");
                $(this).find(".READC").parent().addClass("unsearched");
            }else if($(this).data("use04") != "" && $(this).data("use04") != "undefined" && $(this).data("use04") != null){
                $(this).find(".USRXX").css("visibility","hidden");
                $(this).find(".USE04").val($(this).data("use04")).prop("selected", true);
            }else{
                $(this).find(".USRXX").css("visibility","hidden");
            }
            if($(this).data("ok") == "N"){
                $(this).find("#N_"+$(this).data("id")).prop("checked", true);
            }else if($(this).data("ok") == "O"){
                $(this).find("#O_"+$(this).data("id")).prop("checked", true);
            }
        });
    };

    // 내부 DB 예방정보 아이템 UPDATE 함수
    var saveSearchList = function(){
        var querytag= "";
        var SDATE = $("#txtTDATE").text().substring(0,10).replace(/\./g, "");
        var STIME = $("#txtTDATE").text().slice(-8).replace(/\:/g, "");
        var EToday = window.Utils.getTodayFormat("yyyy.MM.dd HH:mm:ss");
        var EDATE = EToday.substring(0,10).replace(/\./g, "");
        var ETIME = EToday.slice(-8).replace(/\:/g, "");
        $("#list_bj_041 .tableCont").each(function() {
            var VORNR = $(this).find(".VORNR").text();
            var READC = $(this).find(".READC").val();
            var USE04 = $(this).find(".USE04 option:selected").val();
            var OK = $(this).find(".OK:checked").val();
            if(OK == "undefined") {
                var query = 'UPDATE PVNT SET READC = "'+READC+'", USE04 = "'+USE04+'", SDATE = "'+SDATE+'", STIME = "'+STIME+'", EDATE = "'+EDATE+'", ETIME = "'+ETIME+'" WHERE WERKS = "'+getWERKS+'" AND GSTRP = "'+arri_dtst+'" AND ARBPL = "'+getARBPL+'" AND ZPROC = "'+getZPROC+'" AND AUFNR = "'+EQ_NO+'" AND VORNR = "'+VORNR+'" AND TEST = "'+getTEST+'";';
            }else{
                var query = 'UPDATE PVNT SET READC = "'+READC+'", USE04 = "'+USE04+'", OK = "'+OK+'", SDATE = "'+SDATE+'", STIME = "'+STIME+'", EDATE = "'+EDATE+'", ETIME = "'+ETIME+'" WHERE WERKS = "'+getWERKS+'" AND GSTRP = "'+arri_dtst+'" AND ARBPL = "'+getARBPL+'" AND ZPROC = "'+getZPROC+'" AND AUFNR = "'+EQ_NO+'" AND VORNR = "'+VORNR+'" AND TEST = "'+getTEST+'";';
            }

            querytag += query;
        });
        M.db.execute({
            path:getUSER_ID,
            sql:querytag,
            multiple: true,
            callback: function(status, result, name) {
                page.moveToBack();
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