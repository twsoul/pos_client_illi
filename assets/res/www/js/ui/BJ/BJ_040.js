/*******************************************************************
*	페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var MEAS="";
    var arri_dtst="";
    var arri_dtstARR = [];
    var arri_dtstOG="";
    var arri_dtstAF="";
    var tmpSelected = null;
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getPLANT_CD = userManager.getPLANT_CD();
    var getWERKS = optionManager.getWERKS();
    var getARBPL = optionManager.getARBPL();
    var getZPROC = optionManager.getZPROC();
    var getABRHO = optionManager.getABRHO();
    var getTPLNR = optionManager.getTPLNR();
    var getLNG = optionManager.getLNG();
    var getSCAN = optionManager.getSCAN();
    var getTEST = optionManager.getTEST();
    var saveUserCo = dataManager.storage('saveUserCo');
    var TAB = "";
    var TABDATE = "";

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
	    $("#date_st").val(window.Utils.getTodayFormat("yyyy.MM.dd"));
	    $("#date_ed").val(window.Utils.getTodayFormat("yyyy.MM.dd"));
	    $("#txtNM").text(getUSER_NM);
	    createTABLE();
	};
	// 이벤트 초기화
	var setInitEvent = function() {
	    setTabNSwipe();
	    $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    clickList(inputScan);
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000147']").text(), {showtime:"SHORT"});
                }
            }
        });

        // 점검일자 클릭 시 (시작일)
	    $("#date_st").on("click", function(){
    		window.Utils.getCalendar("date_st", null, "date_ed");
    	});

    	// 점검일자 클릭 시 (종료일) Blind
    	$("#date_ed").on("click", function(){
    		window.Utils.getCalendar("date_ed", "date_st", null);
    	});

    	// 조회 버튼 클릭 시
    	$("#btnSearch").on("click", function(){
    	    $("#txtDATE").text("");
    	    $("#txtSUM").text(0);
    	    $("#txtDONE").text(0);
    	    $("#txtUNDONE").text(0);
    	    $("#txtTRAN").text(0);
    	    arri_dtstARR = $("#date_st").val().split(".");
    	    arri_dtstOG = moment(new Date(arri_dtstARR[0],arri_dtstARR[1]-1,arri_dtstARR[2])).format("YYYY.MM.DD");
    	    arri_dtstAF = moment(new Date(arri_dtstARR[0],arri_dtstARR[1]-1,arri_dtstARR[2]-getABRHO)).format("YYYY.MM.DD");
    	    arri_dtst = window.Utils.replaceAll($("#date_st").val(),".", "");
            $(".page_header, .contents_inner").addClass("blind");
    	    var query = 'SELECT * FROM PVNT WHERE WERKS = "'+getWERKS +'" AND GSTRP BETWEEN '+window.Utils.replaceAll(arri_dtstAF,".", "")+' AND '+window.Utils.replaceAll(arri_dtstOG,".", "")+' AND ARBPL = "'+$("#selARBPL option:selected").val()+'" AND ZPROC = "'+getZPROC+'" AND TEST = "'+getTEST+'"';
            M.db.execute(getUSER_ID, query, function(status, result,  name) {''
                if(status == "FAIL") {
                    createTABLE();
                }
                PreventionReqHead();
            });
    	});

    	// 전송 버튼 클릭 시
    	$("#btnSend").on("click",setSend);
    };

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
	    if($("#list_bj_040_1 .tableCont").length > 0) {
	        selectTABLE();
	    }
	};

    // 리스트 스캔 조회 및 날짜 선택 팝업 함수 (기능위치, 설비번호)
    var clickList = function(inputScan) {
        var ListCheck = 0;
        var PopList = [];
        if(isNaN(inputScan.charAt(0))){
            $("#list_bj_040_1 .tableCont").each(function(){
                if($(this).find(".TPLNR").text() == inputScan){
                    ListCheck = ListCheck+1;
                    PopList.push({title:$(this).find(".KTEXT").text() + "[" + $(this).find(".EQ_NO").text() + "]",value:$(this).find(".EQ_NO").text()});
                }
            });
            if(ListCheck == 1){
                $("#list_bj_040_1 .tableCont[data-id='"+inputScan+"']").click();
            }
        }else{
            $("#list_bj_040_1 .tableCont").each(function(){
                if($(this).data("id") == inputScan){
                    ListCheck = ListCheck+1;
                    PopList.push({title:$(this).find(".KTEXT").text() + "[" + $(this).find(".EQ_NO").text() + "]",value:$(this).find(".EQ_NO").text()});
                }
            });
        }
        if(ListCheck == 1){
            if(isNaN(inputScan.charAt(0))){
                $("#list_bj_040_1 .tableCont[data-tplnr='"+inputScan+"']").click();
            }else{
                $("#list_bj_040_1 .tableCont[data-id='"+inputScan+"']").click();
            }
        }
        else if(ListCheck > 1){
            M.pop.list({
                mode : 'SINGLE',
                title : $("[data-lng='LB.0000000173']").text(),
                buttons : [$("[data-lng='MSG.0000000003']").text(), $("[data-lng='MSG.0000000002']").text()],
                list : PopList,
                callback: function (buttonIdx, rowInfo, setting){
                    switch(buttonIdx) {
                    	case 0:
                    		break;
                    	case 1:
                    		$("#list_bj_040_1 .tableCont").each(function(){
                                if($(this).find(".EQ_NO").text() == rowInfo.value){
                                    $(this).click();
                                }
                            });
                    		break;
                    }
                }
            });
        }
        else{
            popupManager.instance($("[data-lng='MSG.0000000151']").text(), {showtime:"SHORT"});
        }
    };

    // 내부 DB 예방점검, 단위정보 테이블 CREATE 함수
	var createTABLE = function() {
        var query = 'CREATE TABLE IF NOT EXISTS PVNT (WERKS TEXT NOT NULL, GSTRP INTEGER, ARBPL TEXT NOT NULL, ZPROC TEXT NOT NULL, AUFNR TEXT NOT NULL, VORNR TEXT NOT NULL, LTXA1 TEXT, PLNNR TEXT, USR00 TEXT, USR04 TEXT, USR05 TEXT, USE04 TEXT, USEYN TEXT, USR01 TEXT, READC TEXT, OK TEXT, SDATE TEXT, STIME TEXT, EDATE TEXT, ETIME TEXT, TEST TEXT NOT NULL, PRIMARY KEY(WERKS, ARBPL, ZPROC, AUFNR, VORNR, TEST));';
            query += 'CREATE TABLE IF NOT EXISTS MEAS (SPRAS TEXT NOT NULL, MSEHI TEXT NOT NULL, DIMID TEXT NOT NULL, ISCODE TEXT, MSEH6 TEXT NOT NULL, ANDEC INTEGER, TEST TEXT NOT NULL, PRIMARY KEY(SPRAS, MSEHI, MSEH6, TEST))';
        M.db.execute({
            path:getUSER_ID,
            sql:query,
            multiple: true,
            callback: function(status, result, name) {
                if(status == "FAIL") {
                    popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                    	title: $("[data-lng='MSG.0000000004']").text(),
                    	buttons:[$("[data-lng='MSG.0000000002']").text()]
                    }, function() {
                    	M.sys.exit();
                    });
                }else{
                    WcInfo();
                }
            }
        });
    };

    // 작업장 조회 함수
    var WcInfo = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/WcInfo.do',
            data: {
                'SERVER': getTEST,
                'bukrs': getCORP_CD,
                'werks': getWERKS,
                'spras': getLNG,
                'event':'ERP PM 작업장 송신'
            },
            success: function(receivedData, setting) {
                var tag = "";
                $.each(receivedData.WcInfoList, function(index,rowData){
                    tag += "<option value='" + rowData.ARBPL + "'>"+ rowData.KTEXT + "</option>";
                });
                $("#selARBPL").append(tag);
                $("#selARBPL").val(getARBPL).prop("selected", true);
                ProcTypeReq();
                $("#selARBPL").on("change", function(){
                    $("#txtDATE").text("");
                    $("#txtSUM").text(0);
                    $("#txtDONE").text(0);
                    $("#txtUNDONE").text(0);
                    $("#txtTRAN").text(0);
                    $(".page_header, .contents_inner").addClass("blind");
                });
            }
        });
    }

    // 업무구분 조회 함수
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
    			$.each(receivedData.ProcTypeReqList, function(index,rowData){
    			    if(rowData.ZPROC == getZPROC){
                        PlantReq(rowData.ZDESC);
                        return;
    			    }
    			});

    		}
    	});
    };

    // 플랜트 조회 함수
    var PlantReq = function(ZDESC) {
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
    			$.each(receivedData.PlantReqList, function(index,rowData){
    			    if(rowData.WERKS == getWERKS ){
    			        $("#txtDEPT").text(rowData.NAME1+" "+ZDESC)
    			        MeasureUnit();
    			        return;
    			    }
    			});
    		}
    	});
    };

    // 단위정보 조회 및 내부 DB INSERT OR REPLACE 함수
    var MeasureUnit = function() {
    	networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/MeasureUnit.do',
    		data: {
    		    'SERVER': getTEST,
    			'spras': getLNG,
    			'bukrs': getCORP_CD,
                'event':'단위정보'
    		},
    		success: function(receivedData, setting) {
    		    if (receivedData.MeasureUnitCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000148']").text(), {showtime:"LONG"});
                    page.moveToBack();
                    return;
                } else {
    		        var querytag= "";
    		        var tag = "<option value='' data-andec='0'></option>";
    			    $.each(receivedData.MeasureUnitList, function(index,rowData){
    			        var query = 'INSERT OR REPLACE INTO MEAS (SPRAS, MSEHI, DIMID, ISCODE, MSEH6, ANDEC, TEST) values ("'+rowData.SPRAS+'","'+rowData.MSEHI+'","'+rowData.DIMID+'","'+rowData.ISCODE+'","'+rowData.MSEH6+'","'+rowData.ANDEC+'","'+getTEST+'");';
    			        tag += "<option value='" + rowData.MSEHI + "' data-andec='"+rowData.ANDEC+"'>" + rowData.MSEH6 + "</option>";
    			        querytag += query;
    			    });
    			    M.db.execute({
                        path:getUSER_ID,
                        sql:querytag,
                        multiple: true,
                        callback: function(status, result, name) {
                        }
                    })
                    MEAS = tag;
    		    }
    		}
    	});
    };

    // 예방점검 오더 조회 함수
	var PreventionReqHead = function() {
	    networkManager.httpSend({
	        server: saveUserCo,
        	path: 'api/PreventionReqHead.do',
        	data: {
        	    'SERVER': getTEST,
        		'bukrs':getCORP_CD,
                'werks':getWERKS ,
                'gstrp':arri_dtst,
                'arbpl':$("#selARBPL option:selected").val(),
                'zproc':getZPROC,
                'abrho':getABRHO,
                'event':'예방점검 오더(Header)'
        	},
        	success: function(receivedData, setting) {
        		$("#list_bj_040_1").html("");
        		if (receivedData.PreventionReqHeadCount == 0){
        		    popupManager.instance($("[data-lng='MSG.0000000152']").text(), {showtime:"SHORT"});
                } else {
                    exShowIndicator("");
                    var tagLi = "";
                    var tag = "";
                    var templateLi = $("#ListTemplateLi").html();
        	    	var template = $("#ListTemplateAll").html();
        	    	var preGSTRP="";
        	    	var i = 0;
        		    $.each(receivedData.PreventionReqHeadList, function(index,rowData){
        		        if(preGSTRP != rowData.GSTRP && i != 0) {
                            tagLi += templateLi.replace(/\{\{CONTENT\}\}/, tag)
                                               .replace(/\{\{DATE\}\}/gi, preGSTRP)
                                               .replace(/\{\{COUNT\}\}/, i);
                            tag = "";
                            i=0;
                        }
        		        tag += template.replace(/\{\{INDEX\}\}/gi, index)
                                       .replace(/\{\{EQUNR\}\}/, rowData.EQUNR)
                                       .replace(/\{\{DATE\}\}/, rowData.GSTRP)
                                       .replace(/\{\{DATEL\}\}/, rowData.GLTRP)
                                       .replace(/\{\{EQ_NO\}\}/, rowData.AUFNR)
                                       .replace(/\{\{STATUS\}\}/, "")
                                       .replace(/\{\{CHECK_LIST\}\}/, rowData.KTEXT)
                                       .replace(/\{\{PART_LOC\}\}/gi, rowData.TPLNR)
                                       .replace(/\{\{PART_NM\}\}/, rowData.EQKTX)
                                       .replace(/\{\{MLINK\}\}/, "mLink");
                        preGSTRP = rowData.GSTRP;
                        i=i+1;
                    });
                    tagLi += templateLi.replace(/\{\{CONTENT\}\}/, tag)
                                        .replace(/\{\{DATE\}\}/gi, preGSTRP)
                                        .replace(/\{\{COUNT\}\}/, i);
        	    	$("#list_bj_040_1").append(tagLi);
        	    	setListRowEvent();
        	    	$("#txtSUM").text(receivedData.PreventionReqHeadCount);
        	    	exHideIndicator("");
        	    	PreventionReqItem();
            	}
            }
        })
    };

    // 예방정보 아이템 조회 및 내부 DB INSERT OR UPDATE 함수 함수
	var PreventionReqItem = function(){
	    networkManager.httpSend({
	        server: saveUserCo,
        	path: 'api/PreventionReqItem.do',
        	data: {
        	    'SERVER': getTEST,
        		'bukrs':getCORP_CD,
                'werks':getWERKS ,
                'gstrp':arri_dtst,
                'arbpl':$("#selARBPL option:selected").val(),
                'zproc':getZPROC,
                'abrho':getABRHO,
                'event':'예방점검 항목(Item)'
        	},
        	success: function(receivedData, setting) {
        		if (receivedData.PreventionReqItemCount == 0){
        		    popupManager.instance($("[data-lng='MSG.0000000152']").text(), {showtime:"SHORT"});
                } else {
                    exShowIndicator("");
                    var querytag= "BEGIN;";
        		    $.each(receivedData.PreventionReqItemList, function(index,rowData){
        		        if(rowData.STEUS == "PM08"){
        		            $("#list_bj_040_1 .tableCont").each(function(){
        		                if($(this).find(".EQ_NO").text() == rowData.AUFNR) {
        		                    var GSTRP =  window.Utils.replaceAll($(this).find(".DATE").text(),"-", "");
        		                    var query = 'INSERT OR IGNORE INTO PVNT (WERKS, GSTRP, ARBPL, ZPROC, AUFNR, VORNR, LTXA1, PLNNR, USR00, USR04, USR05, USEYN, USR01, TEST) values ("'+getWERKS+'","'+GSTRP+'","'+$("#selARBPL option:selected").val()+'","'+getZPROC+'","'+rowData.AUFNR+'","'+rowData.VORNR+'","'+rowData.LTXA1+'","'+rowData.PLNNR+'","'+rowData.USR00+'","'+rowData.USR04+'","'+rowData.USR05+'","'+rowData.USE04+'","'+rowData.USR01+'","'+getTEST+'");';
                                    querytag += query;
                                    query = 'UPDATE PVNT SET WERKS = "'+getWERKS+'", GSTRP = "'+GSTRP+'", ARBPL = "'+$("#selARBPL option:selected").val()+'", ZPROC = "'+getZPROC+'", AUFNR = "'+rowData.AUFNR+'", VORNR = "'+rowData.VORNR+'", LTXA1 = "'+rowData.LTXA1+'", PLNNR = "'+rowData.PLNNR+'", USR00 = "'+rowData.USR00+'", USR04 = "'+rowData.USR04+'", USR05 = "'+rowData.USR05+'", USEYN = "'+rowData.USE04+'", USR01 = "'+rowData.USR01+'" WHERE WERKS = "'+getWERKS+'" AND GSTRP = "'+GSTRP+'" AND ARBPL = "'+$("#selARBPL option:selected").val()+'" AND ZPROC = "'+getZPROC+'" AND AUFNR = "'+rowData.AUFNR+'" AND VORNR = "'+rowData.VORNR+'" AND TEST = "'+getTEST+'";';
        		                    querytag += query;
        		                }
        		            });
        		        }
                    });
                    querytag += 'COMMIT;'
                    M.db.execute({
                        path:getUSER_ID,
                        sql:querytag,
                        multiple: true,
                        callback: function(status, result, name) {
                            if(getSCAN == 0){
                                $("#inputScan").closest("div").removeClass("blind");
                            }
                            $(".page_header, .contents_inner").removeClass("blind");
                            $("#txtDATE").text(moment(arri_dtstAF).format("YYYY.MM.DD")+" ~ "+moment(arri_dtstOG).format("YYYY.MM.DD"));
                            exHideIndicator("");
                            selectTABLE();
                        }
                    });
            	}
            }
        })
    };

    // 전체 -> 미완료, 완료 구분 함수 (내부 DB 비교)
    var selectTABLE = function(){
        exShowIndicator("");
        $("#list_bj_040_2").html("");
        $("#list_bj_040_3").html("");
        var tag1 = "";
        var tag2 = "";
        var tagLi1 = "";
        var tagLi2 = "";
        var preGSTRP1="";
        var preGSTRP2="";
        var i1 = 0;
        var i2 = 0;
        $("#list_bj_040_1 [data-instance-class='accordion-handler']").each(function(){
            if($(this).find(".tableCont").length < 1) {
                $(this).remove();
            }else{
                var header = $(this).find(".DATEN").text();
                $(this).find(".DATEN").text(header.substr(0,13)+$(this).find(".tableCont").length+header.slice(-2));
            }
        })
        if($("#list_bj_040_1 .tableCont").length < 1){
            $("#txtDONE").text(0);
            $("#txtUNDONE").text(0);
            exHideIndicator("");
            return;
        }
        $("#list_bj_040_1 .tableCont").each(function(i){
            var INDEX = $(this).data("index");
            var DATE = $(this).find(".DATE").text();
            var DATEL = $(this).data("datel");
            var EQ_NO = $(this).find(".EQ_NO").text();
            var CHECK_LIST = $(this).find(".KTEXT").text();
            var PART_LOC = $(this).find(".TPLNR").text();
            var PART_NM =  $(this).find(".EQKTX").text();
            var template = $("#ListTemplate").html();
            var templateLi = $("#ListTemplateLi").html();
            var query = 'SELECT USR01, READC, OK, CHK_YN FROM (SELECT USR01, READC, OK, (CASE WHEN LENGTH(USEYN) > 0 AND LENGTH(READC) > 0 AND LENGTH(OK) > 0 THEN "Y" WHEN LENGTH(USEYN) = 0 AND LENGTH(READC) > 0 AND LENGTH(OK) > 0 THEN "Y" WHEN LENGTH(USEYN) = 0 AND LENGTH(READC) = 0 AND LENGTH(OK) > 0 THEN "Y" ELSE "N" END) AS CHK_YN FROM PVNT WHERE WERKS = "'+getWERKS +'" AND ARBPL = "'+$("#selARBPL option:selected").val()+'" AND ZPROC = "'+getZPROC+'" AND AUFNR = "'+$(this).find(".EQ_NO").text()+'" AND TEST = "'+getTEST+'") WHERE CHK_YN = "N"';
            M.db.execute(getUSER_ID, query, function(status, result, name) {
                if(result.row_count > 0){
                    if(preGSTRP1 != DATE && i1 != 0) {
                        tagLi1 += templateLi.replace(/\{\{CONTENT\}\}/, tag1)
                                            .replace(/\{\{DATE\}\}/gi, preGSTRP1)
                                            .replace(/\{\{COUNT\}\}/, i1);
                        tag1 = "";
                        i1=0;
                    }
                    $("#list_bj_040_1 .tableCont:eq("+INDEX+")").find(".STATUS").text($("[data-lng='LB.0000000140']:eq(0)").text());
                    $("#list_bj_040_1 .tableCont:eq("+INDEX+")").find(".STATUS").css("color","red");
                    tag1 += template.replace(/\{\{DATE\}\}/, DATE)
                                   .replace(/\{\{DATEL\}\}/, DATEL)
                                   .replace(/\{\{EQ_NO\}\}/, EQ_NO)
                                   .replace(/\{\{STATUS\}\}/, $("#list_bj_040_1 .tableCont:eq("+INDEX+")").find(".STATUS").text())
                                   .replace(/\{\{CHECK_LIST\}\}/, CHECK_LIST)
                                   .replace(/\{\{PART_LOC\}\}/, PART_LOC)
                                   .replace(/\{\{PART_NM\}\}/, PART_NM)
                                   .replace(/\{\{MLINK\}\}/, "mLink2");
                    preGSTRP1 = DATE;
                    i1=i1+1;
                }else if(result.row_count == 0){
                    if(preGSTRP2 != DATE && i2 != 0) {
                        tagLi2 += templateLi.replace(/\{\{CONTENT\}\}/, tag2)
                                            .replace(/\{\{DATE\}\}/gi, preGSTRP2)
                                            .replace(/\{\{COUNT\}\}/, i2);
                        tag2 = "";
                        i2=0;
                    }
                    $("#list_bj_040_1 .tableCont:eq("+INDEX+")").find(".STATUS").text($("[data-lng='LB.0000000139']:eq(0)").text());
                    $("#list_bj_040_1 .tableCont:eq("+INDEX+")").find(".STATUS").css("color","black");
                    tag2 += template.replace(/\{\{DATE\}\}/, DATE)
                                   .replace(/\{\{DATEL\}\}/, DATEL)
                                   .replace(/\{\{EQ_NO\}\}/, EQ_NO)
                                   .replace(/\{\{STATUS\}\}/, $("#list_bj_040_1 .tableCont:eq("+INDEX+")").find(".STATUS").text())
                                   .replace(/\{\{CHECK_LIST\}\}/, CHECK_LIST)
                                   .replace(/\{\{PART_LOC\}\}/, PART_LOC)
                                   .replace(/\{\{PART_NM\}\}/, PART_NM)
                                   .replace(/\{\{MLINK\}\}/, "mLink3");
                    preGSTRP2 = DATE;
                    i2=i2+1;
                }
                if(i+1 === $("#list_bj_040_1 .tableCont").length){
                    if(i1 > 0) {
                        tagLi1 += templateLi.replace(/\{\{CONTENT\}\}/, tag1)
                                            .replace(/\{\{DATE\}\}/gi, preGSTRP1)
                                            .replace(/\{\{COUNT\}\}/, i1);
                        $("#list_bj_040_2").append(tagLi1);
                        setListRowEvent2();
                    }
                    if(i2 > 0) {
                        tagLi2 += templateLi.replace(/\{\{CONTENT\}\}/, tag2)
                                            .replace(/\{\{DATE\}\}/gi, preGSTRP2)
                                            .replace(/\{\{COUNT\}\}/, i2);
                        $("#list_bj_040_3").append(tagLi2);
                        setListRowEvent3();
                    }
                    $("#txtUNDONE").text($("#list_bj_040_2 .tableCont").length);
                    $("#txtDONE").text($("#list_bj_040_3 .tableCont").length);
                    exHideIndicator("");
                    if(getSCAN == 0){
                        $("#inputScan").focus();
                    }
                    if(TAB == "1") {
                        $("#list_bj_040_1 [data-instance-class='accordion-handler'][data-date='"+TABDATE+"']").click();
                    }
                    if(TAB == "2") {
                        $("#list_bj_040_2 [data-instance-class='accordion-handler'][data-date='"+TABDATE+"']").click();
                    }
                    if(TAB == "3") {
                        $("#list_bj_040_3 [data-instance-class='accordion-handler'][data-date='"+TABDATE+"']").click();
                    }
                }
            });
        });
    }

    // 아코디언 동작 함수
    var accordionEvent = function(obj) {
        $("[data-instance-class='accordion-content']").css('height', 0);
        $("[data-instance-class='accordion-handler']").removeClass('on');
        if(tmpSelected != $("[data-instance-class='accordion-handler']").index(obj)){
            $(obj).find("[data-instance-class='accordion-content']").css('height', '100%');
        	/*$(obj).find("[data-instance-class='accordion-content']").css('height', $(obj).find('li').length() * $(obj).find('li').height());*/
        	$(obj).addClass('on');
        	tmpSelected = $("[data-instance-class='accordion-handler']").index(obj);
        }else{
        	$(obj).find("[data-instance-class='accordion-content']").css('height', 0);
        	tmpSelected = null;
        }
    }

	// 리스트에 클릭 이벤트 등록 (전체)
	var setListRowEvent = function(){
		$(".mLink").off("click","**");
		$(".mLink").on("click", function(){
			var code = $(this).data("code");
			if (code != undefined) {
				$(this).addClass("on");
				$(this).siblings().removeClass("on");
			}
			TAB = "1";
			TABDATE = $(this).find(".DATE").text();
			screenManager.moveToPage("BJ_041.html", {
                param: {
                    ARBPL: M.sec.encrypt($("#selARBPL option:selected").val()).result,
                    EQ_NO: M.sec.encrypt($(this).find(".EQ_NO").text()).result,
                    STATUS: M.sec.encrypt($(this).find(".STATUS").text()).result,
                    DATE: M.sec.encrypt($(this).find(".DATE").text()).result,
                    DATEL: M.sec.encrypt($(this).data("datel")).result,
                    CHECK_LIST: M.sec.encrypt($(this).find(".KTEXT").text()).result,
                    PART_LOC: M.sec.encrypt($(this).find(".TPLNR").text()).result,
                    PART_NM: M.sec.encrypt($(this).find(".EQKTX").text()).result,
                    MEASURE: M.sec.encrypt(MEAS).result
                }
            });
		})
	};

	// 리스트에 클릭 이벤트 등록 (미완료)
	var setListRowEvent2 = function(){
		$(".mLink2").off("click","**");
		$(".mLink2").on("click", function(){
			var code = $(this).data("code");
			if (code != undefined) {
				$(this).addClass("on");
				$(this).siblings().removeClass("on");
			}
			TAB = "2";
            TABDATE = $(this).find(".DATE").text();
			screenManager.moveToPage("BJ_041.html", {
                param: {
                    ARBPL: M.sec.encrypt($("#selARBPL option:selected").val()).result,
                    EQ_NO: M.sec.encrypt($(this).find(".EQ_NO").text()).result,
                    STATUS: M.sec.encrypt($(this).find(".STATUS").text()).result,
                    DATE: M.sec.encrypt($(this).find(".DATE").text()).result,
                    DATEL: M.sec.encrypt($(this).data("datel")).result,
                    CHECK_LIST: M.sec.encrypt($(this).find(".KTEXT").text()).result,
                    PART_LOC: M.sec.encrypt($(this).find(".TPLNR").text()).result,
                    PART_NM: M.sec.encrypt($(this).find(".EQKTX").text()).result,
                    MEASURE: M.sec.encrypt(MEAS).result
                }
            });
		})
	};

	// 리스트에 클릭 이벤트 등록 (완료)
	var setListRowEvent3 = function(){
		$(".mLink3").off("click","**");
		$(".mLink3").on("click", function(){
			var code = $(this).data("code");
			if (code != undefined) {
				$(this).addClass("on");
				$(this).siblings().removeClass("on");
			}
			TAB = "3";
            TABDATE = $(this).find(".DATE").text();
			screenManager.moveToPage("BJ_041.html", {
                param: {
                    ARBPL: M.sec.encrypt($("#selARBPL option:selected").val()).result,
                    EQ_NO: M.sec.encrypt($(this).find(".EQ_NO").text()).result,
                    STATUS: M.sec.encrypt($(this).find(".STATUS").text()).result,
                    DATE: M.sec.encrypt($(this).find(".DATE").text()).result,
                    DATEL: M.sec.encrypt($(this).data("datel")).result,
                    CHECK_LIST: M.sec.encrypt($(this).find(".KTEXT").text()).result,
                    PART_LOC: M.sec.encrypt($(this).find(".TPLNR").text()).result,
                    PART_NM: M.sec.encrypt($(this).find(".EQKTX").text()).result,
                    MEASURE: M.sec.encrypt(MEAS).result
                }
            });
		})
	};

    // 전송 확인 팝업 함수
	var setSend = function() {
	    if($("#list_bj_040_3 .tableCont").length < 1) {
            return;
        }else{
    	    popupManager.alert($("[data-lng='MSG.0000000159']").text(), {
                title: $("[data-lng='MSG.0000000004']").text(),
                buttons: [$("[data-lng='MSG.0000000003']").text(), $("[data-lng='MSG.0000000002']").text()]
    	    }, function(index) {
    	    	switch(index) {
    	    		case 0:
    	    			break;
    	    		case 1:
    	    			sendList();
    	    			break;
    	    	}
    	    });
    	}
    };

    // 예방점검 아이템 전송 문자열 생성 함수
	var sendList = function(){
	    $("#list_bj_040_3 .tableCont").each(function(i){
	        var pvntList = [];
	        var SDATE = "";
	        var STIME = "";
	        var EDATE = "";
            var ETIME = "";
            var DATE = window.Utils.replaceAll($(this).find(".DATE").text(),"-", "");
            var EQ_NO = $(this).find(".EQ_NO").text();
            var query = 'SELECT * FROM PVNT WHERE WERKS = "'+getWERKS +'" AND ARBPL = "'+$("#selARBPL option:selected").val()+'" AND ZPROC = "'+getZPROC+'" AND AUFNR = "'+EQ_NO+'" AND TEST = "'+getTEST+'"';
            M.db.execute(getUSER_ID, query, function(status, result, name) {
                $.each(result.row_list, function(index,rowData){
                    pvntList.push({"bukrs":getCORP_CD,"aufnr":rowData.AUFNR,"vornr":rowData.VORNR,"readc":rowData.READC,"mrngu":rowData.USE04,"ok":rowData.OK});
                });
                var rowData = result.row_list[0];
                SDATE = rowData.SDATE;
                STIME = rowData.STIME;
                EDATE = rowData.EDATE;
                ETIME = rowData.ETIME;

                PreventionResultHead(EQ_NO,SDATE,STIME,EDATE,ETIME,pvntList,i+1);
                if(i+1 === $("#list_bj_040_3 .tableCont").length){
                }
            });
        });
	};

    // 예방점검 아이템 전송 처리 함수
    var PreventionResultItem = function(EQ_NO,pvntList,count) {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PreventionResultItem.do',
        	data: {
        	    'SERVER': getTEST,
        		'tbody':pvntList,
                'event':'예방점검 결과 아이템 수신'
        	},
        	success: function(receivedData, setting) {
        		if (receivedData.PreventionResultItemReturn == "S"){
        		    popupManager.instance(receivedData.PreventionResultItemMsg, {showtime:"SHORT"});
        		    var query = 'DELETE FROM PVNT WHERE WERKS = "'+getWERKS +'" AND ARBPL = "'+$("#selARBPL option:selected").val()+'" AND ZPROC = "'+getZPROC+'" AND AUFNR = "'+EQ_NO+'" AND TEST = "'+getTEST+'"';
                    M.db.execute(getUSER_ID, query, function(status, result, name) {
                        $("#list_bj_040_1 .tableCont").each(function(){
                            if($(this).find(".EQ_NO").text() == EQ_NO){
                                $(this).closest("li").remove();
                                if(count === $("#list_bj_040_3 .tableCont").length) {
                                    selectTABLE();
                                    $("#txtTRAN").text(parseInt($("#txtTRAN").text())+count);
                                }
                            }
                        })
                    });
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000160']").text(), {showtime:"SHORT"});
            	}
            }
        })
    };

    // 예방점검 오더 전송 처리 함수
	var PreventionResultHead = function(EQ_NO,SDATE,STIME,EDATE,ETIME,pvntList,count) {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PreventionResultHead.do',
        	data: {
        	    'SERVER': getTEST,
        		'bukrs':getCORP_CD,
                'aufnr':EQ_NO,
                'isdd':SDATE,
                'isdz':STIME,
                'iedd':EDATE,
                'iedz':ETIME,
                'empnm01':getUSER_NM,
                'empnm02':'',
                'empnm03':'',
                'empnm04':'',
                'empnm05':'',
                'empnm06':'',
                'empnm07':'',
                'memo':'',
                'event':'예방점검 결과 헤더 수신'
        	},
        	success: function(receivedData, setting) {
        	    if (receivedData.PreventionResultHeadReturn == "S"){
        	        PreventionResultItem(EQ_NO,pvntList,count)
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000160']").text(), {showtime:"SHORT"});
                }
            }
        })
    }

    // 탭 동작 함수
	var setTabNSwipe = function() {
    	$(".tabmenu > div > h5").on("click", function(){
    		$(this).addClass("on");
    		$(this).siblings("h5").removeClass("on");
    		var p = $(this).index();
    		if( p == 0 ){
    			$(".contents_inner").css("transform", "translateX(0%)");
    			$(".contents_inner").children(".form1").css("height", "auto");
    			$(".contents_inner").children(".form2").css("height", "0");
    			$(".contents_inner").children(".form3").css("height", "0");
    			$(".btn_ins").addClass("blind");
    		}else if ( p == 1){
    			$(".contents_inner").css("transform", "translateX(calc(-100% / 3))");
    			$(".contents_inner").children(".form1").css("height", "0");
             	$(".contents_inner").children(".form2").css("height", "auto");
           		$(".contents_inner").children(".form3").css("height", "0");
           		$(".btn_ins").addClass("blind");
    		}else if ( p == 2){
           		$(".contents_inner").css("transform", "translateX(calc(-100% / 1.5))");
           		$(".contents_inner").children(".form1").css("height", "0");
                $(".contents_inner").children(".form2").css("height", "0");
                $(".contents_inner").children(".form3").css("height", "auto");
                $(".btn_ins").removeClass("blind");
            };
    	});

    	if($(".tabmenu > div > h5").hasClass("on")){	// 초기화면 리셋
    		var p = $(".tabmenu > div > h5").index();
    		if( p == 0 ){
    			$(".contents_inner").css("transform", "translateX(0%)");
    			$(".contents_inner").children(".form1").css("height", "auto");
                $(".contents_inner").children(".form2").css("height", "0");
                $(".contents_inner").children(".form3").css("height", "0");
                $(".btn_ins").addClass("blind");
    		}else if ( p == 1){
    			$(".contents_inner").css("transform", "translateX(calc(-100% / 3))");
    			$(".contents_inner").children(".form1").css("height", "0");
                $(".contents_inner").children(".form2").css("height", "auto");
                $(".contents_inner").children(".form3").css("height", "0");
                $(".btn_ins").addClass("blind");
    		}else if ( p == 2){
            	$(".contents_inner").css("transform", "translateX(calc(-100% / 1.5))");
            	$(".contents_inner").children(".form1").css("height", "0");
                $(".contents_inner").children(".form2").css("height", "0");
                $(".contents_inner").children(".form3").css("height", "auto");
                $(".btn_ins").removeClass("blind");
           	};
    	}
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
		accordionEvent: accordionEvent
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