/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var C1_LIST = [];
    var C2_LIST = [];
    var Ban_Line_List = [];
    var pre_count = 0;

    var banTag = "";
    var lineTag = "";
    var plantChk = "";
    var dkindflag = false;                  // 이종품 체크 플래그
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
	};

	// 이벤트 초기화
    var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 원창, 현창, 반 콤보박스 신규 호출
        $("#selPLANT").on("change", function() {
            StorageLocationReq("10");
            StorageLocationReq2();
        });

        // 원창 변경 시 스캔 포커스
        $("#selLOCTP").on("change", function() {
            $("#inputScan").focus();
        });

        // 현창 변경 시 스캔 포커스
        $("#selLOCTP2").on("change", function() {
            $("#inputScan").focus();
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on("click", function() {
            setSaveClickEvent();
        });

        // 초기화 버튼 클릭 시
        $("#btnInit").on("click", function() {
            console.log("LOC_TP_TYPE : "+$("#selLOCTP2 option:selected").attr('value1'));
            setClearClickEvent();
        });
    };

    // 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/PlantCodeList.do',
    		data: {
            	'LANG': getLNG,
            	'WERKS': getCORP_CD
            },
    		success: function(receivedData, setting) {
    		    $("#selPLANT").html("");
    		    if(receivedData.ListCount == 0){
    		        popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
    		    }else{
    		        var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                    	tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.LINE_CD_FLAG + "' value2='" + rowData.ETC_FLAG +"'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq("10");
                    StorageLocationReq2();
    		    }
    		}
    	});
    };

    // 원창 콤보박스 정보 조회
    var StorageLocationReq = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': [type]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";

                $("#selLOCTP").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                if($("#selPLANT option:selected").val() == getWERKS){
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
        	}
        });
        $("#inputScan").focus();
    }

    // 현창 콤보박스 정보 조회
    var StorageLocationReq2 = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': ["20","30"]
            },
            success: function(receivedData, setting) {
                var tag = "";

                $("#selLOCTP2").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "' value1='" + rowData.LOC_TP_TYPE + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP2").append(tag);

            }
        });
        $("#inputScan").focus();
    }

    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        var userLocTpCheck2 = $("#selLOCTP2").val();
        var loc_tp_type = $("#selLOCTP2 option:selected").attr('value1');
        console.log("LOC_TP_TYPE : "+loc_tp_type);

        if(userPlantCheck == null){
             popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
             $("#inputScan").focus();
             return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000245']").text(), {showtime:"LONG"}); // 원창을 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck2 == null){
            popupManager.instance($("[data-lng='MSG.0000000246']").text(), {showtime:"LONG"}); // 현창을 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if(loc_tp_type == "20"){ // 현창(조립)인 경우
                $("#list_ot_035_1").parent().removeClass("blind");
                $("#list_ot_035_2").parent().addClass("blind");
                BoxNoScan20(inputScan);
            } else if(loc_tp_type == "30"){ // 현창(가공)인 경우
                $("#list_ot_035_1").parent().addClass("blind");
                $("#list_ot_035_2").parent().removeClass("blind");
                sel_Ban_Set(partNoProcessing(inputScan),inputScan);
            }
        }
    }

    // 부품식별표 조회 (조립)
    var BoxNoScan20 = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_035_S1.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.SEL_FLAG == "N") {
                    popupManager.instance($("[data-lng='MSG.0000000546']").text(), {showtime:"LONG"}); // 선별품 부품식별표가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if (parseInt(rowData.OK_QTY) < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000549']").text(), {showtime:"LONG"}); // 이미 선별된 부품식별표  입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                if($("#txtDELI_NO").text() == ""){
                    $("#txtDELI_NO").text(rowData.DELI_NO);
                    $("#txtPART_CD").text(rowData.PART_CD);
                    $("#txtOK_QTY").text(rowData.OK_QTY);
                }else{
                    if($("#txtDELI_NO").text() != rowData.DELI_NO){
                        popupManager.instance($("[data-lng='MSG.0000000547']").text(), {showtime:"LONG"}); // 해당 부품식별표와 납입문서가 일치하지 않습니다
                        $("#inputScan").focus();
                        return;
                    }
                    if($("#txtPART_CD").text() != rowData.PART_CD){
                        popupManager.instance($("[data-lng='MSG.0000000548']").text(), {showtime:"LONG"}); // 해당 부품식별표와 품번이 일치하지 않습니다
                        $("#inputScan").focus();
                        return;
                    }
                }

                var tag = "";
                var template = $("#ListTemplate").html();
                tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                               .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                               .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())   // 부품식별표
                               .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text())   // 스캔수량
                               .replace(/\{\{LB0000000550\}\}/, $("[data-lng='LB.0000000550']").text());  // 실수량


                // 스캔시 플랜트와 원창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $("#selLOCTP2").attr("disabled",true);

                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                // 이종품 체크 플래그
                if(rowData.DKIND == "Y"){
                    dkindflag = true;
                }

                $("#list_ot_035_1").prepend(tag);
                $("#inputScan").focus();
            }
        });
    };

    // 부품식별표 조회 (가공)
    var BoxNoScan30 = function(box_barcode,partcdban) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_035_S1.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.SEL_FLAG == "N") {
                    popupManager.instance($("[data-lng='MSG.0000000546']").text(), {showtime:"LONG"}); // 선별품 부품식별표가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if (parseInt(rowData.OK_QTY) < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000549']").text(), {showtime:"LONG"}); // 이미 선별된 부품식별표  입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                if($("#txtDELI_NO").text() == ""){
                    $("#txtDELI_NO").text(rowData.DELI_NO);
                    $("#txtPART_CD").text(rowData.PART_CD);
                    $("#txtOK_QTY").text(rowData.OK_QTY);
                }else{
                    if($("#txtDELI_NO").text() != rowData.DELI_NO){
                        popupManager.instance($("[data-lng='MSG.0000000547']").text(), {showtime:"LONG"}); // 해당 부품식별표와 납입문서가 일치하지 않습니다
                        $("#inputScan").focus();
                        return;
                    }
                    if($("#txtPART_CD").text() != rowData.PART_CD){
                        popupManager.instance($("[data-lng='MSG.0000000548']").text(), {showtime:"LONG"}); // 해당 부품식별표와 품번이 일치하지 않습니다
                        $("#inputScan").focus();
                        return;
                    }
                }

                var tag = "";
                var template = $("#ListTemplate2").html();

                tag += template.replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                               .replace(/\{\{item\}\}/, banTag)
                               .replace(/\{\{item2\}\}/, lineTag)
                               .replace(/\{\{PART_CD_BAN\}\}/, partcdban)
                               .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())   // 부품식별표
                               .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text())   // 스캔수량
                               .replace(/\{\{LB0000000550\}\}/, $("[data-lng='LB.0000000550']").text())   // 실수량
                               .replace(/\{\{LB0000000162\}\}/, $("[data-lng='LB.0000000162']").text())   // 반
                               .replace(/\{\{LB0000000156\}\}/, $("[data-lng='LB.0000000156']").text());  // 불출라인

                // 스캔시 플랜트, 원창 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $("#selLOCTP2").attr("disabled",true);
                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                $("#list_ot_035_2").prepend(tag);
                Ban_line_set(rowData.PART_CD);
                $("#inputScan").focus();
            }
        });
    };

    var Ban_line_set = function(part_cd){
        console.log("Ban_line_set");
        var exist = false;
        var ban = $("#list_ot_035_2 .tableCont").children('div:eq(0)').find(".selBAN").val();


        $.each(Ban_Line_List,function(key){
            console.log("Ban_Line_List[key]['PART_CD'] : "+Ban_Line_List[key]['PART_CD']);
            console.log("part_cd : "+part_cd);
            if(Ban_Line_List[key]['PART_CD'] == part_cd){
                $("#list_ot_035_2 .tableCont").children('div:eq(0)').find(".selBAN").val(Ban_Line_List[key]['BAN']).prop("selected", true);
                exist = true;
                line_set(Ban_Line_List[key]['BAN'],part_cd,part_cd);
            }
        });

        if(!exist){
            Ban_Line_List.push({"PART_CD":part_cd, "BAN":ban, "LINE":""});
        }
    }

    var line_set = function(ban,part_cd,temp){
        console.log("ban : "+ban);
        console.log("part_cd : "+part_cd);

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LineCodeList2.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'AREA_CD': ban,
                'PART_CD': part_cd,
                'event':'라인 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                $("#list_ot_035_2 .tableCont").children('div:eq(0)').find(".selLINE").html("");
                if(receivedData.ListCount == 0){
                    line_set(ban,"",part_cd);
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                    });
                    $("#list_ot_035_2 .tableCont").children('div:eq(0)').find(".selLINE").append(tag);

                    $.each(Ban_Line_List,function(key){
                        console.log("Ban_Line_List[key]['PART_CD'] : "+Ban_Line_List[key]['PART_CD']);
                        console.log("part_cd : "+temp);
                        if(Ban_Line_List[key]['PART_CD'] == temp){
                            if(Ban_Line_List[key]['LINE'] == ""){
                                Ban_Line_List[key]['LINE'] = rowData.LINE_CD;
                            }
                            $("#list_ot_035_2 .tableCont").children('div:eq(0)').find(".selLINE").val(Ban_Line_List[key]['LINE']).prop("selected", true);
                        }
                    });
                }
            }
        });
    }

    var partNoProcessing = function(barcode){
        var myResult = /:P[0-9,A-Z](?!G,?!A).{1,}:/g.exec(barcode);
        if (myResult!=null) {
            var part_no = myResult[0].substr(2,myResult[0].length-3);

            if (part_no.indexOf(":")<0) {
                console.log(part_no);
                return part_no;
            }else{
                var strPart= part_no.substr(0,part_no.indexOf(":"));
                //strPart = strPart.replace(/-+/,"");
                console.log(strPart);
                return strPart;
            }
        }else{
            return "";
        }
    }

    // 반, 라인 콤보박스 정보 조회
    var sel_Ban_Set = function(part_cd,bar_no){
        console.log("----------sel_Ban_Set----------");
        var first_ban = "";
        var part_cd_flag = "";

        if(part_cd == ""){
            part_cd_flag = "N";
        } else {
            part_cd_flag = "Y";
        }
        console.log("part_cd_flag : "+part_cd_flag);

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/AreaCodeList2.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'PART_CD': part_cd,
                'event':'반 정보 조회'
            },
            success: function(receivedData, setting) {
                console.log("check1");
                if(receivedData.ListCount == 0){
                    sel_Ban_Set("",bar_no);
                    return;
                }else{
                    var tag = "";

                    $.each(receivedData.ListData, function(index,rowData){
                        if(index == 0){
                            first_ban = rowData.AREA_CD;
                        }
                        tag += "<option value='" + rowData.AREA_CD + "'>" + rowData.AREA_NM + "</option>";
                    });
                    banTag = tag;
                    console.log("banTag : "+banTag);
                    networkManager.httpSend({
                        server: saveUserCo,
                        path: 'api/LineCodeList2.do',
                        data: {
                            'PLANT_CD': $("#selPLANT").val(),
                            'AREA_CD': first_ban,
                            'PART_CD': part_cd,
                            'event':'라인 정보 조회'
                        },
                        success: function(receivedData, setting) {
                            console.log("check2");
                            if(receivedData.ListCount == 0){
                                var tag = "";
                                lineTag = tag;
                            }else{
                                var tag = "";

                                $.each(receivedData.ListData, function(index,rowData){
                                    tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                                });
                                lineTag = tag;
                            }
                            console.log("check3");
                        }
                    });
                }
                BoxNoScan30(bar_no,part_cd_flag);
            }
        });

        $("#inputScan").focus();
    }

    // 라인 콤보 박스 정보 조회
    var sel_Line_Set = function(obj){
        console.log("----------sel_Line_Set----------");
        var line_part_cd = "";
        var temp = $(obj).parent().parent().parent().siblings().find(".PART_NO").text();

        console.log("partcdban : "+$(obj).parent().parent().parent().parent().parent().data("partcdban"));
        if($(obj).parent().parent().parent().parent().parent().data("partcdban") == "Y"){
            line_part_cd = $(obj).parent().parent().parent().siblings().find(".PART_NO").text();
        }

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LineCodeList2.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'AREA_CD': $(obj).val(),
                'PART_CD': line_part_cd,
                'event':'라인 정보 조회'
            },
            success: function(receivedData, setting) {
                $(obj).parent().parent().siblings().find(".selLINE").html("");
                if(receivedData.ListCount == 0){
                    var tag = "";
                    popupManager.instance($("[data-lng='MSG.0000000279']").text(), {showtime:"LONG"}); // 라인 정보가 존재하지 않습니다
                    $(obj).parent().parent().siblings().find(".selLINE").append(tag);
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                    });
                    $(obj).parent().parent().siblings().find(".selLINE").append(tag);

                    $.each(Ban_Line_List,function(key){
                        console.log("Ban_Line_List[key]['PART_CD'] : "+Ban_Line_List[key]['PART_CD']);
                        console.log("part_cd : "+temp);
                        if(Ban_Line_List[key]['PART_CD'] == temp){
                            Ban_Line_List[key]['BAN'] = $(obj).val();
                            Ban_Line_List[key]['LINE'] = rowData.LINE_CD;
                        }
                    });

                    $.each(Ban_Line_List,function(key,value){
                        console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                        $.each(value,function(key,value){
                            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                        });
                    });
                }
            }
        });

        $("#inputScan").focus();
    }

    var line_change = function(obj){
        var temp = $(obj).parent().parent().parent().siblings().find(".PART_NO").text();
        console.log("temp : "+temp);
        console.log("LINE : "+$(obj).val());

        $.each(Ban_Line_List,function(key){
            console.log("Ban_Line_List[key]['PART_CD'] : "+Ban_Line_List[key]['PART_CD']);
            console.log("part_cd : "+temp);
            if(Ban_Line_List[key]['PART_CD'] == temp){
                Ban_Line_List[key]['LINE'] = $(obj).val();
            }
        });
        $("#inputScan").focus();
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var loc_tp_type = $("#selLOCTP2 option:selected").attr('value1');
        var total_real_qty = 0;
        var saveChk = true;
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(loc_tp_type == "20"){
            $("#list_ot_035_1 .tableCont").each(function() {
                C1_LIST.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_LOC_TP":$("#selLOCTP2").val(), "BAN_CD":"","LINE_CD":"", "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendorcd"), "PART_CD":$("#txtPART_CD").text(), "EXP_QTY":$(this).find(".REAL_QTY").val(), "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                total_real_qty += parseInt($(this).find(".REAL_QTY").val());
            });
        } else if(loc_tp_type == "30"){
            $("#list_ot_035_2 .tableCont").each(function() {
                if($(this).find(".selBAN").val() != "" && $(this).find(".selLINE").val() !=""){
                    C1_LIST.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_LOC_TP":$("#selLOCTP2").val(), "BAN_CD":$(this).find(".selBAN").val(),"LINE_CD":$(this).find(".selLINE").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendorcd"), "PART_CD":$("#txtPART_CD").text(), "EXP_QTY":$(this).find(".REAL_QTY").val(), "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                    total_real_qty += parseInt($(this).find(".REAL_QTY").val());
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000280']").text(), {showtime:"LONG"}); // 반정보, 라인정보를 입력해야 저장이 가능합니다
                    saveChk = false;
                }
            });
        }

        if(total_real_qty != parseInt($("#txtOK_QTY").text())){
            popupManager.instance($("[data-lng='MSG.0000000552']").text(), {showtime:"LONG"}); // 전체실수량이 합격수량과 일치하지 않습니다
            saveChk = false;
        }
        C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtDELI_NO").text(), "PART_CD":$("#txtPART_CD").text(), "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});

        if(saveChk){ // 저장가능
        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        $.each(C2_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

            save();
        } else { // 저장 불가능
            C1_LIST.length = 0;
            C2_LIST.length = 0;
            return;
        }
    }

    // PR_PDA_OT_035_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        var loc_tp_type = $("#selLOCTP2 option:selected").attr('value1');
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_035_C1.do',
            data: {
                'param1': C1_LIST,
                'param2': C2_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    if(loc_tp_type == "20"){
                        if(dkindflag){
                            screenManager.moveToPage("OT_040.html", {
                                param: {
                                    PLANT: M.sec.encrypt($("#selPLANT option:selected").val()).result,
                                    LOCTP: M.sec.encrypt($("#selLOCTP2 option:selected").val()).result
                                }
                            });
                        }else{
                            popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                        }
                    }else{
                        popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    }
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    C1_LIST.length = 0;
                    C2_LIST.length = 0;
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                C1_LIST.length = 0;
                C2_LIST.length = 0;
                saveflag = false;
            }
        });
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;
        var loc_tp_type = $("#selLOCTP2 option:selected").attr('value1');

        if (loc_tp_type == "20") {
            $("#list_ot_035_1 .tableCont").each(function() {
                if($(this).data("boxno") == box_no){
                    rtn = true;
                    return false; // each문의 break;
                }
            });
        } else if(loc_tp_type == "30"){
            $("#list_ot_035_2 .tableCont").each(function() {
                if($(this).data("boxno") == box_no){
                    rtn = true;
                    return false; // each문의 break;
                }
            });
        }

        return rtn;
    };

    var setClearClickEvent = function(){
        clear();
    }

    // 화면 초기화
    var clear = function() {
        $("#list_ot_035_1").html("");
        $("#list_ot_035_2").html("");
        $("#txtBoxNo").text("");
        $("#txtDELI_NO").text("");
        $("#inpBoxQty").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selLOCTP2").attr("disabled",false);

        $("#txtPART_CD").text("");
        $("#txtOK_QTY").text("");

        dkindflag = false;
        C1_LIST.length = 0;
        C2_LIST.length = 0;
        Ban_Line_List.length = 0;
        saveflag = false;
        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        var preQty = Number($(".SCAN_QTY").text())-Number($(".DIV_QTY").val());

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }

        if(preQty < 0){
            popupManager.instance($("[data-lng='MSG.0000000247']").text(), {showtime:"LONG"}); // 분할불출 수량이 스캔수량보다 많습니다
            $(".DIV_QTY").val("0");
            $(".PRE_QTY").text(pre_count);
        } else if(preQty == 0){
            popupManager.instance($("[data-lng='MSG.0000000283']").text(), {showtime:"LONG"}); // 불출할 수량이 스캔수량과 같을경우 일반불출을 사용해 주십시오
            $(".DIV_QTY").val("0");
            $(".PRE_QTY").text(pre_count);
        } else {
            $(".PRE_QTY").text(preQty);
        }
    };

    var scanFocus = function(){
        $("#inputScan").focus();
    }

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		inputEvent: inputEvent,
		sel_Line_Set: sel_Line_Set,
		scanFocus: scanFocus,
		line_change: line_change
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