/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    // 부품식별표 바코드 Processing
    var lp_box_no = "";
    var lp_part_no = "";
    var lp_box_qty = "";
    var lp_box_lot_no = "";
    var lp_box_BoxSeq = "";
    var lp_box_Prt = "";
    var lp_box_vendcd = "";

    // 저장 리스트 목록
    var C3_LIST = [];
    var C4_LIST = [];
    var Box_BarCode_Arr = [];
    var Box_No_Arr = [];
    var Deli_List_Arr = [];

    // 총 지시수량 및 스캔수량 초기화
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;               // 과납 여부 체크 플래그
    var deli_flag = false;              // 납입문서가 존재 하는지 체크 하는 flag
    var OTHER_FLAG = false;             // 타 공장 허용 플래그
    var barcode_chk = true;             // 정상 바코드 체크 플래그

    // IN_010에서 데이터 받아온 경우
    var sPlant = "";
    var sLocTp = "";
    var ORDR_NO = "";

    var plant_cd = "";
    var deli_CASE = "";
    var OP_CHECK = "";                  // IN_010에서 타공장인지 체크 여부
    var other_plant_flag = "Y";         // 타공장 허용 여부

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        // IN_010에서 넘어온 값이 있을 때 초기화 부분
        sPLANT = dataManager.param("sPLANT");
	    sLocTp = dataManager.param("sLOCTP");
	    ORDR_NO = dataManager.param("ORDR_NO");
	    OP_CHECK = dataManager.param("OP_CHECK");

        // 화면 초기화시 공장, 저장위치 콤보박스 조회
        PlantReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();

                console.log("inputScan : "+inputScan);
                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selTOPLANT").on('change', function() {
            StorageLocationReq();
        })

        // 저장위치 변경 시 스캔으로 포커스
        $("#selTOLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 타공장 선택 공장 변경 시 스캔으로 포커스
        $("#selPLANT").on('change', function() {
            $("#inputScan").focus();
        })

        // 타공장 선택 저장위치 변경 시 스캔으로 포커스
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
        })
    };

    // 내부 DB 입고 스캔 CREATE 함수
    var createTABLE = function() {
        var query = 'CREATE TABLE IF NOT EXISTS INBOX (DELINO TEXT NOT NULL, BOXBAR TEXT NOT NULL, PRIMARY KEY(DELINO, BOXBAR))';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            if(status == "FAIL") {
                popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                	title: $("[data-lng='MSG.0000000004']").text(),
                	buttons:[$("[data-lng='MSG.0000000002']").text()]
                }, function() {
                	M.sys.exit();
                });
            }
        });
    };

    // 내부 DB 입고 스캔 SELECT 함수
    var selectTABLE = function(data) {
        var DBlist = [];
        $.each(data.row_list, function(index,rowData){
            DBlist.push(rowData.BOXBAR);
        });
        PartNoScanTemp(DBlist);
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
                $("#selTOPLANT").html("");
                $("#selPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.CNTR_BAR_FLAG + "' value2='" + rowData.INSP_FIND_YN + "' value3='" + rowData.OVER_CHK_FLAG +"'>" + rowData.TEXT + "</option>";
                    });
                    $("#selTOPLANT").append(tag);
                    $("#selPLANT").append(tag);

                    // IN_010에서 설정된 플랜트 정보로 플랜트 값 설정
                    if(sPLANT != "" && sPLANT != null && sPLANT != undefined) {
                        $("#selTOPLANT").val(sPLANT).prop("selected", true);
                    }else{
                        $("#selTOPLANT").val(getWERKS).prop("selected", true);
                    }
                    StorageLocationReq();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        if(!OTHER_FLAG){
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/LocCodeList.do',
                data: {
                    'PLANT': $("#selTOPLANT option:selected").val(),
                    'TYPE': ["10"]
                },
                success: function(receivedData, setting) {
                    var tag = "";
                    $("#selTOLOCTP").html("");
                    if(receivedData.ListCount != 0){
                         $.each(receivedData.ListData, function(index,rowData){
                            tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                         });
                    }
                    $("#selTOLOCTP").append(tag);
                    if($("#selTOPLANT option:selected").val() == getWERKS){
                        $("#selTOLOCTP").val(getLGORT).prop("selected", true);
                    }
                    // IN_010에서 설정된 저장위치 정보로 저장위치 값 설정
                    if(sLocTp != "" && sLocTp != null && sLocTp != undefined) {
                         $("#selTOLOCTP").val(sLocTp).prop("selected", true);
                    }
                    // 배차 입고로 납입카드 화면 호출시 납입문서가 존재 할 경우 처리
                    if(ORDR_NO != ""){
                        ScanValidation(ORDR_NO);
                    }
                }
            });
        }else{ // 타 공장 허용시
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/LocCodeList.do',
                data: {
                    'PLANT': $("#selPLANT option:selected").val(),
                    'TYPE': ["10"]
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
                }
            });
        }

        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selTOPLANT").val();
        var userLocTpCheck = $("#selTOLOCTP").val();
        var deli_no = "";

        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if(deli_flag == false) { // 납입카드 스캔 내역이 없을 때
                if(!head_tail_chk(inputScan)){ // 바코드 형식이 아닐경우
                    deli_no = inputScan;
                }else{ // 바코드 형식일 경우
                    deli_no = deliNoProcessing(inputScan);
                }
                Deli_No_Sel(deli_no,inputScan);
            } else if(deli_flag == true) { // 납입카드 스캔 내역이 있는 경우 부품식별표 스캔
                PartNoScan(inputScan);
            }
        }
    }

    // 바코드 DELI_NO 추출 함수
    var deliNoProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:DN.{2,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            console.log("잘못된 DELI_NO 바코드");
            barcode_chk = false;
            return "";
        }
    }

    // 바코드 PART_CD 추출 함수
    var partCdProcessing = function(part_cd){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:CY\[[0-9,A-Z](?!G,?!A).{1,}:/g.exec(part_cd);
        if (myResult!=null) {
            var part_no = myResult[0].substr(4,myResult[0].length-3);
            console.log("part_no : "+ part_no);
            if (part_no.indexOf(":")<0) { // ":" 를 찾지 못했을경우
                barcode_chk = false;
            }else{
                var strPart= part_no.substr(0,part_no.indexOf("]:"));
                var part = "";
                var part_qty = "";
                while(strPart.indexOf(",")>=0){ // 바코드에 PART_CD가 여러개인 경우 처리
                    tempPart = strPart.substr(strPart.indexOf(",")+1,strPart.length);
                    strPart = strPart.substr(0,strPart.indexOf(","));
                    part = strPart.substr(0,strPart.indexOf("="));
                    part_qty = strPart.substr(strPart.indexOf("=")+1,strPart.length);
                    C4_LIST.push({"COPORATE_CD":getCORP_CD, "TO_PLANT_CD":$("#selTOPLANT").val(), "DELI_NO":deliNoProcessing(part_cd), "PART_CD":part, "DELI_QTY":part_qty, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                    strPart = tempPart;
                }
                part = strPart.substr(0,strPart.indexOf("="));
                part_qty = strPart.substr(strPart.indexOf("=")+1,strPart.length);

                C4_LIST.push({"COPORATE_CD":getCORP_CD, "TO_PLANT_CD":$("#selTOPLANT").val(), "DELI_NO":deliNoProcessing(part_cd), "PART_CD":part, "DELI_QTY":part_qty, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                $.each(C4_LIST,function(key,value){
                    console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                    $.each(value,function(key,value){
                        console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                    });
                });
                console.log(strPart);
            }
        }else{
            console.log("PART_CD가 존재하지 않음");
            barcode_chk = false;
        }
    }

    // 바코드 WORK_SEQ 추출 함수
    var workSeqProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:6E.{3,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            console.log("WORK_SEQ가 존재하지 않음");
            barcode_chk = false;
            return "";
        }
    }

    // 바코드 VENDOR_CD 추출 함수
    var vendorCdProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:V.{2,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(2,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            console.log("VENDOR_CD 존재하지 않음");
            barcode_chk = false;
            return "";
        }
    }

    var head_tail_chk = function(deli_bar_no){
        var head,tail;
        console.log(deli_bar_no);
        head = deli_bar_no.substr(0,4);
        console.log(head);
        tail = deli_bar_no.substr(deli_bar_no.length-4,4);
        console.log(tail);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    var No_Deli_Bar = function(deli_bar_no){
        console.log("barcode_chk : "+barcode_chk);
        if(!head_tail_chk(deli_bar_no)){
            barcode_chk = false;
            console.log("head_tail_chk fail");
        }
        C3_LIST.push({"COPORATE_CD":getCORP_CD, "TO_PLANT_CD":$("#selTOPLANT").val(), "TO_LOC_TP":$("#selTOLOCTP").val(), "TO_LOC_TP_NM":$("#selTOLOCTP option:selected").text(), "DELI_NO":deliNoProcessing(deli_bar_no), "DELI_BAR_NO":chgBar(deli_bar_no), "WORK_SEQ":workSeqProcessing(deli_bar_no), "VENDOR_CD":vendorCdProcessing(deli_bar_no), "WORK_ID":getUSER_ID, "RTN_MSG":""});

        $.each(C3_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        console.log("barcode_chk : "+barcode_chk);
        partCdProcessing(deli_bar_no);
        console.log("barcode_chk : "+barcode_chk);
        if(barcode_chk){
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/PR_PDA_IN_020_C3.do',
                data: {
                    'param1': C3_LIST,
                    'param2': C4_LIST
                },
                success: function(receivedData, setting) {
                    if(receivedData.result=="S"){
                        popupManager.instance($("[data-lng='MSG.0000000481']").text(), {showtime:"LONG"}); // 신규 납입카드를 생성하였습니다
                        C3_LIST.length = 0;
                        C4_LIST.length = 0;
                        ScanValidation(deli_bar_no);
                    }else{
                        popupManager.instance($("[data-lng='MSG.0000000480']").text(), {showtime:"LONG"}); // 신규 납입카드 생성에 실패하였습니다
                        C3_LIST.length = 0;
                        C4_LIST.length = 0;
                    }
                },
                error: function(errorCode, errorMessage, settings) {
                    popupManager.instance($("[data-lng='MSG.0000000480']").text(), {showtime:"LONG"}); // 신규 납입카드 생성에 실패하였습니다
                    C3_LIST.length = 0;
                    C4_LIST.length = 0;
                }
            });
        }else{
            popupManager.instance($("[data-lng='MSG.0000000479']").text(), {showtime:"LONG"}); // 잘못된 바코드 형식입니다
            C3_LIST.length = 0;
            C4_LIST.length = 0;
            return;
        }
    }

    var chgBar = function(bar_no){
        console.log("bar_no : "+bar_no);
        var bar = bar_no.replace(/\[/g,"^&")
                        .replace(/\]/g,"&^")
                        .replace(/\,/g,"^*")
                        .replace(/\=/g,"^%");
        console.log("bar : "+bar);

        return bar;

    }

    // 납입 카드 정보 조회 함수
    var Deli_No_Sel = function(deli_bar_no,deli_barcode_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectDeliNoO.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'DELI_BAR_NO':deli_bar_no,
                'PLANT_CD':$("#selTOPLANT").val(),
                'LANG':getLNG,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                if(receivedData.ListCount == 0){
                    //No_Deli_Bar(deli_barcode_no);
                    popupManager.instance($("[data-lng='MSG.0000000129']").text(), {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                    if(ORDR_NO != ""){
                        moveToBack();
                    }
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_TYPE != "Y" && rowData.DELI_TYPE != "N"){
                    popupManager.instance($("[data-lng='MSG.0000000314']").text(), {showtime:"LONG"}); // 올바르지않은 납입문서입니다
                    if(ORDR_NO != ""){
                        moveToBack();
                    }
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_ST == "99"){
                    popupManager.instance($("[data-lng='MSG.0000000508']").text(), {showtime:"LONG"}); // 발행 취소된 납입카드 입니다
                    if(ORDR_NO != ""){
                        moveToBack();
                    }
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.IN_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000273']").text(), {showtime:"LONG"}); // 이미 납입된 납입카드 번호입니다
                    if(ORDR_NO != ""){
                        moveToBack();
                    }
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_CASE == undefined){
                    popupManager.instance($("[data-lng='MSG.0000000495']").text(), {showtime:"LONG"}); // 납품유형이 누락되었습니다
                    if(ORDR_NO != ""){
                        moveToBack();
                    }
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOUSING_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000695']").text(), {showtime:"LONG"}); // 하우징입고 메뉴를 사용해 주십시오
                    if(ORDR_NO != ""){
                        moveToBack();
                    }
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD.substr(0,2) == '11' && rowData.ARRI_CD == 'R500'){ //납입카드가 지곡공장 타용도 원창인 경우 적용
                    if(rowData.PLANT_CD != $("#selTOPLANT").val() || rowData.ARRI_CD != $("#selTOLOCTP").val()) {

                        popupManager.instance($("[data-lng='MSG.0000000593']").text(), {showtime:"LONG"}); //타용도 원창 납입품입니다. 정확한 플랜트/저장위치로 입고하십시오
                        if(ORDR_NO != ""){
                            moveToBack();
                        }
                        $("#inputScan").focus();
                        return;
                    }
                }
                var COLOR = "";
                var tag = "";
                var insp = true;
                var template = $("#ListTemplate").html();
                $.each(receivedData.ListData, function(index,rowData){
                    if(rowData.OVER_QTY <= 0){
                        COLOR = "nBluebox1";
                    } else {
                        COLOR = "nRedbox1";
                    }

                    tag += template.replace(/\{\{PART_NO\}\}/, rowData.PART_CD)
                                   .replace(/\{\{OVER_QTY\}\}/, rowData.OVER_QTY == undefined ? 0 : rowData.OVER_QTY)
                                   .replace(/\{\{COLOR\}\}/, COLOR)
                                   .replace(/\{\{ORD_QTY\}\}/, rowData.DELI_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY)
                                   .replace(/\{\{vPartNo\}\}/, rowData.PART_CD)
                                   .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                   .replace(/\{\{BOX_QTY\}\}/, rowData.BOX_QTY)
                                   .replace(/\{\{DELI_QTY\}\}/, rowData.DELI_QTY)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{INSP_FLAG\}\}/, rowData.INSP_FLAG)
                                   .replace(/\{\{DELI_TYPE\}\}/, rowData.DELI_TYPE)
                                   .replace(/\{\{LOT_NO\}\}/, rowData.LOT_NO)
                                   .replace(/\{\{SCAN_BOX_CNT\}\}/, "0")
                                   .replace(/\{\{VEND_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VEND_NM\}\}/, rowData.VENDOR_NM);
                    Tot_Deli_Qty += parseInt(rowData.DELI_QTY);
                    if(rowData.OTHER_PLANT_MOVE_FLAG == "N"){
                        other_plant_flag = rowData.OTHER_PLANT_MOVE_FLAG;
                    }
                    if(rowData.INSP_FLAG == undefined){
                        insp = false;
                    }
                });

                if(!insp){
                    popupManager.instance($("[data-lng='MSG.0000000458']").text(), {showtime:"LONG"}); // 검사유무 기준정보가 누락되었습니다
                    if(ORDR_NO != ""){
                        moveToBack();
                    }
                    $("#inputScan").focus();
                    return;
                }

                if(rowData.PLANT_CD != $("#selTOPLANT").val()){ //공장이 다를때
                    if(other_plant_flag == "N"){ //타공장 불허
                        Tot_Deli_Qty = 0;
                        popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                        if(ORDR_NO != ""){
                            moveToBack();
                        }
                        $("#inputScan").focus();
                        return;
                    }else{
                        if(OP_CHECK == "Y"){
                            $("#selTOLOCTP").attr("disabled",true);
                            $("#selTOPLANT").attr("disabled",true);
                            $("#selDELI").removeClass("blind");
                            $("#selPLANT").val(rowData.PLANT_CD).prop("selected", true);
                            $("#selPLANT").attr("disabled",true);
                            OTHER_FLAG = true;
                            StorageLocationReq();
                            $("#list_in_020_head").removeClass("blind");
                            deli_flag = true;
                            deli_CASE = rowData.DELI_CASE;
                            plant_cd = rowData.PLANT_CD;
                            $("#list_in_020").append(tag);
                            $("#txtVEND_CD").text(rowData.VENDOR_CD);
                            $("#txtVEND_NM").text(rowData.VENDOR_NM);
                            $("#txtORDR_NO").text(rowData.DELI_NO);
                            popupManager.instance($("[data-lng='MSG.0000000499']").text() + rowData.DELI_CASE_NM, {showtime:"LONG"}); // 납품유형 :
                        } else {
                            popupManager.alert($("[data-lng='MSG.0000000115']").text(), { // 타 공장 바코드입니다, 그래도 진행 하시겠습니까?
                            title: $("[data-lng='MSG.0000000004']").text(), // 알림
                            buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
                            }, function(index) {
                                if (index == 1){
                                    Tot_Deli_Qty = 0;
                                    $("#inputScan").focus();
                                    return;
                                }else{
                                    $("#selTOLOCTP").attr("disabled",true);
                                    $("#selTOPLANT").attr("disabled",true);
                                    $("#selDELI").removeClass("blind");
                                    $("#selPLANT").val(rowData.PLANT_CD).prop("selected", true);
                                    $("#selPLANT").attr("disabled",true);
                                    OTHER_FLAG = true;
                                    StorageLocationReq();
                                    $("#list_in_020_head").removeClass("blind");
                                    deli_flag = true;
                                    deli_CASE = rowData.DELI_CASE;
                                    plant_cd = rowData.PLANT_CD;
                                    $("#list_in_020").append(tag);
                                    $("#txtVEND_CD").text(rowData.VENDOR_CD);
                                    $("#txtVEND_NM").text(rowData.VENDOR_NM);
                                    $("#txtORDR_NO").text(rowData.DELI_NO);
                                    popupManager.instance($("[data-lng='MSG.0000000499']").text() + rowData.DELI_CASE_NM, {showtime:"LONG"}); // 납품유형 :
                                }
                            })
                        }
                    }
                }else{
                    other_plant_flag = "N";
                    $("#selTOLOCTP").attr("disabled",true);
                    $("#selTOPLANT").attr("disabled",true);
                    $("#list_in_020_head").removeClass("blind");
                    deli_flag = true;
                    deli_CASE = rowData.DELI_CASE;
                    plant_cd = rowData.PLANT_CD;
                    $("#list_in_020").append(tag);
                    $("#txtVEND_CD").text(rowData.VENDOR_CD);
                    $("#txtVEND_NM").text(rowData.VENDOR_NM);
                    $("#txtORDR_NO").text(rowData.DELI_NO);
                    popupManager.instance($("[data-lng='MSG.0000000499']").text() + rowData.DELI_CASE_NM, {showtime:"LONG"}); // 납품유형 :
                }
                if($("#txtORDR_NO").text() != ""){
                    var query = 'SELECT BOXBAR FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'"';
                    M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        if(status == "FAIL") {
                            createTABLE();
                        } else {
                            if(result.row_count > 0){
                                selectTABLE(result);
                            }
                        }
                    });
                }
                $("#inputScan").focus();
            }
        });
    };

    // 임시데이터 조회
   var PartNoScanTemp = function(DBlist) {
       networkManager.httpSend({
           server: saveUserCo,
           path: 'api/selectBoxNoInTemp.do',
           data: {
               'COPORATE_CD':getCORP_CD,
               'BOX_BAR_NO':DBlist,
               'event':'정보 수신 및 전송'
           },
           success: function(receivedData, setting) {
               $.each(receivedData.ListData, function(index,rowData){
                   if(DBlist.indexOf(rowData.BOX_BAR_NO) != -1){
                       DBlist.splice(DBlist.indexOf(rowData.BOX_BAR_NO),1);
                   }
                   if(rowData.BOX_YN == "Y"){
                       var query = 'DELETE FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'" AND BOXBAR = "'+rowData.BOX_BAR_NO+'"';
                       M.db.execute(getUSER_ID, query, function(status, result,  name) {
                       });
                   }else{
                       var insp_flag = "";
                       $("#list_in_020 .tableCont").each(function() {
                           if($(this).data("vpartno") == rowData.PART_CD){
                               $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                               $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);

                               // 한 로우에 스캔 수량이 지시수량을 초과하는 경우
                               if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                                   over_chk = true; // 과납 플래그 true 처리
                                   $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                               }

                               // 한 로우에 스캔 수량이 지시수량과 일치하는 경우
                               if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                                   $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                               }

                               Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                               $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                               if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 총 지시수량과 스캔수량이 같은경우
                                   $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                               } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 총 스캔수량이 지시 수량을 넘는 경우
                                   over_chk = true; // 과납 플래그 true 처리
                                   $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                               }
                               insp_flag = $(this).data("inspflag");
                               $(this).prependTo('div .list_in_020:eq(1)');
                           }
                       });
                       Box_No_Arr.push(rowData.BOX_NO);
                       Box_BarCode_Arr.push({"BAR_FLAG":"N", "COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":plant_cd, "LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(),"TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":rowData.BOX_BAR_NO, "LOT_NO":rowData.LOT_NO == undefined ? "":rowData.LOT_NO, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "INSP_FLAG":insp_flag, "OTHER_PLANT_MOVE_FLAG":other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                   }
               });
               if(DBlist.length > 0){
                   for(var i = 0; i < DBlist.length; i++ ) {
                       barcodeProcessingTemp(DBlist[i]);
                       if(i == DBlist.length-1)$("#inputScan").focus();
                   }
               }else{
                   $("#inputScan").focus();
               }
           }
       });
   }

   // 임시데이터 바코드 가공 처리
   var barcodeProcessingTemp = function(barcode){
       var qrCode = new qrManager.QRcode(barcode);
       qrcode_callback(qrCode);
       var insp_flag = "";
       var coperate_cd = "";
       $("#list_in_020 .tableCont").each(function() {
           if($(this).data("vpartno") == lp_part_no){
               $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(lp_box_qty));
               $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
               if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                   over_chk = true;
                   $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
               }
               if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                   $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
               }
               Tot_Scan_Qty += parseInt(lp_box_qty);
               $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
               if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                   $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
               } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                   over_chk = true;
                   $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
               }
               insp_flag = $(this).data("inspflag");
               coperate_cd = $(this).data("coperatecd");
               $(this).prependTo('div .list_in_020:eq(1)');
           }
       });
       Box_No_Arr.push(lp_box_no);
       Box_BarCode_Arr.push({"BAR_FLAG":"Y", "COPORATE_CD":coperate_cd,"PLANT_CD":plant_cd,"LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(),"TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":barcode, "LOT_NO":lp_box_lot_no, "BOX_NO":lp_box_no, "VENDOR_CD":lp_box_vendcd, "PART_CD":lp_part_no, "INV_QTY":Number(lp_box_qty), "INSP_FLAG":insp_flag, "OTHER_PLANT_MOVE_FLAG":other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
   }

    // 스캔 시 부품식별표별 품번 조회
    var PartNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNoIn.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'BOX_BAR_NO':boxBarCode,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    console.log("value1 : "+$("#selTOPLANT option:selected").attr('value1'));
                    if($("#selTOPLANT option:selected").attr('value1') == "Y"){
                        barcodeProcessing(boxBarCode);
                    } else {
                        popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                        $("#inputScan").focus();
                    }
                    return;

                }
                if(rowData.VENDOR_CD != $("#txtVEND_CD").text()){
                    popupManager.instance($("#txtVEND_CD").text()+ " / "+ rowData.VENDOR_CD + $("[data-lng='MSG.0000000132']").text(), {showtime:"LONG"}); // 납입카드와 부품식별표의 업체코드가 일치하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BOX_YN == "Y"){
                    popupManager.instance(rowData.BOX_NO +" "+$("[data-lng='MSG.0000000284']").text(), {showtime:"LONG"}); // 는 이미 입고된 Box입니다
                    $("#inputScan").focus();
                    return;
                }
                var insp_flag = "";
                Box_No_Arr.forEach(function(arr){
                    if(rowData.BOX_NO == arr){
                        bar_exists = true;
                    }
                });
                if(!bar_exists){
                    Box_No_Arr.push(rowData.BOX_NO);
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }

                $("#list_in_020 .tableCont").each(function() {
                    if($(this).data("vpartno") == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);

                        // 한 로우에 스캔 수량이 지시수량을 초과하는 경우
                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                            over_chk = true; // 과납 플래그 true 처리
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }

                        // 한 로우에 스캔 수량이 지시수량과 일치하는 경우
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }

                        Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 총 지시수량과 스캔수량이 같은경우
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 총 스캔수량이 지시 수량을 넘는 경우
                            over_chk = true; // 과납 플래그 true 처리
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        exists = true;
                        insp_flag = $(this).data("inspflag");
                        $(this).prependTo('div .list_in_020:eq(1)');
                    }
                });
                if(!exists){
                    Box_No_Arr.pop();
                    popupManager.instance($("[data-lng='MSG.0000000271']").text(), {showtime:"LONG"}); // 납입지시내역에 존재하지 않는 PART NO입니다
                    $("#inputScan").focus();
                    return;
                }else{
                    var query = 'INSERT OR REPLACE INTO INBOX (DELINO, BOXBAR) values ("'+$("#txtORDR_NO").text()+'","'+rowData.BOX_BAR_NO+'")';
                    M.db.execute(getUSER_ID, query, function(status, result, name) {
                        if(status == "FAIL") {
                            popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                            	title: $("[data-lng='MSG.0000000004']").text(),
                            	buttons:[$("[data-lng='MSG.0000000002']").text()]
                            }, function() {
                            	M.sys.exit();
                            });
                        }
                    });
                    Box_BarCode_Arr.push({"BAR_FLAG":"N", "COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":plant_cd, "LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(),"TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":rowData.BOX_BAR_NO, "LOT_NO":rowData.LOT_NO == undefined ? "":rowData.LOT_NO, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "INSP_FLAG":insp_flag, "OTHER_PLANT_MOVE_FLAG":other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                }
                $("#inputScan").focus();
            }
        });
    }

    // 바코드 가공 처리
    var barcodeProcessing = function(barcode){
        var qrCode = new qrManager.QRcode(barcode);
        var exists = false;
        var bar_exists = false;

        if(!qrManager.isValidBarcode(qrCode)){
            console.log("fail");
            return;
        }
        qrcode_callback(qrCode);

        if(lp_box_vendcd != $("#txtVEND_CD").text()){
            popupManager.instance($("#txtVEND_CD").text()+ " / "+ lp_box_vendcd + $("[data-lng='MSG.0000000132']").text(), {showtime:"LONG"}); // 납입카드와 부품식별표의 업체코드가 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }

        var insp_flag = "";
        var coperate_cd = "";
        Box_No_Arr.forEach(function(arr){
            if(lp_box_no == arr){
                bar_exists = true;
            }
        });
        if(!bar_exists){
            Box_No_Arr.push(lp_box_no);
        } else {
            popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
            $("#inputScan").focus();
            return;
        }

        $("#list_in_020 .tableCont").each(function() {
            if($(this).data("vpartno") == lp_part_no){
                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(lp_box_qty));
                $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                    over_chk = true;
                    $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                }
                if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                    $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                }
                Tot_Scan_Qty += parseInt(lp_box_qty);
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                    over_chk = true;
                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                }
                exists = true;
                insp_flag = $(this).data("inspflag");
                coperate_cd = $(this).data("coperatecd");
                $(this).prependTo('div .list_in_020:eq(1)');
            }
        });
        if(!exists){
            Box_No_Arr.pop();
            popupManager.instance($("[data-lng='MSG.0000000271']").text(), {showtime:"LONG"}); // 납입지시내역에 존재하지 않는 PART NO입니다
            $("#inputScan").focus();
            return;
        }else{
            var query = 'INSERT OR REPLACE INTO INBOX (DELINO, BOXBAR) values ("'+$("#txtORDR_NO").text()+'","'+barcode+'")';
            M.db.execute(getUSER_ID, query, function(status, result, name) {
                if(status == "FAIL") {
                    popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                    	title: $("[data-lng='MSG.0000000004']").text(),
                    	buttons:[$("[data-lng='MSG.0000000002']").text()]
                    }, function() {
                    	M.sys.exit();
                    });
                }
            });
            Box_BarCode_Arr.push({"BAR_FLAG":"Y", "COPORATE_CD":coperate_cd,"PLANT_CD":plant_cd,"LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(),"TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":barcode, "LOT_NO":lp_box_lot_no, "BOX_NO":lp_box_no, "VENDOR_CD":lp_box_vendcd, "PART_CD":lp_part_no, "INV_QTY":Number(lp_box_qty), "INSP_FLAG":insp_flag, "OTHER_PLANT_MOVE_FLAG":other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
        }
        $("#inputScan").focus();
    }

    // 저장 조건 처리
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(OTHER_FLAG){ // 타 공장 허용인 경우 이동 저장위치 필수 입력
            if($("#selLOCTP").val() == null){
                popupManager.instance($("[data-lng='MSG.0000000318']").text(), {showtime:"LONG"}); // 납입 저장위치를 먼저 선택하십시오
                $("#inputScan").focus();
                return;
            }
        }

        if($("#selTOPLANT option:selected").attr('value2') == "N"){
            if(Tot_Scan_Qty != Tot_Deli_Qty){
                popupManager.instance($("[data-lng='MSG.0000000276']").text(), {showtime:"LONG"}); // 납입카드 지시수량과 스캔수량이 일치하지 않습니다
                $("#inputScan").focus();
                return;
            }else{
                save();
            }
        }else if(Tot_Scan_Qty<Tot_Deli_Qty){
            popupManager.alert($("[data-lng='MSG.0000000274']").text(), { // 미납 되었습니다, 그래도 저장 하시겠습니까?
            title: $("[data-lng='MSG.0000001000']").text(), // 미납 저장 여부 메시지
            buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 예, 아니오
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    save();
                }
            });
        }else if(Tot_Scan_Qty > Tot_Deli_Qty || (Tot_Scan_Qty == Tot_Deli_Qty && over_chk == true)){
            if($("#selTOPLANT option:selected").attr('value3') == "Y"){
                popupManager.instance($("[data-lng='MSG.0000000276']").text(), {showtime:"LONG"}); // 납입카드 지시수량과 스캔수량이 일치하지 않습니다
                $("#inputScan").focus();
                return;
            }
            popupManager.alert($("[data-lng='MSG.0000000275']").text(), { // 과납 되었습니다, 그래도 저장 하시겠습니까?
            title: $("[data-lng='MSG.0000001001']").text(), // 과납 저장 여부 메시지
            buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 예, 아니오
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    save();
                }
            });
        }else{
            save();
        }
    }

    // 저장 처리
    var save = function() {
        saveflag = true;
        if(OTHER_FLAG){
            $.each(Box_BarCode_Arr,function(key){
                Box_BarCode_Arr[key]['LOC_TP'] = $("#selLOCTP").val();
            });

            $("#list_in_020 .tableCont").each(function() {
                var PART_NM = $(this).data("partnm").replace(/\[/g,"^&")
                                                    .replace(/\]/g,"&^")
                                                    .replace(/\,/g,"^*")
                                                    .replace(/\=/g,"^%");
                Deli_List_Arr.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "TO_PLANT_CD":$("#selTOPLANT").val(), "TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text() ,"VENDOR_CD":$("#txtVEND_CD").text(),"VENDOR_NM":$("#txtVEND_NM").text(), "PART_CD":$(this).find(".PART_NO").text(), "PART_NM":PART_NM, "DELI_QTY":$(this).data("deli"), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "SCAN_CNT":$(this).find(".SCAN_BOX_CNT").text(), "INSP_FLAG":$(this).data("inspflag"),"OTHER_PLANT_MOVE_FLAG": other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
            });
        } else {
            $("#list_in_020 .tableCont").each(function() {
                var PART_NM = $(this).data("partnm").replace(/\[/g,"^&")
                                                    .replace(/\]/g,"&^")
                                                    .replace(/\,/g,"^*")
                                                    .replace(/\=/g,"^%");
                Deli_List_Arr.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$(this).data("plantcd"),"LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(), "TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text() ,"VENDOR_CD":$("#txtVEND_CD").text(),"VENDOR_NM":$("#txtVEND_NM").text(), "PART_CD":$(this).find(".PART_NO").text(), "PART_NM":PART_NM, "DELI_QTY":$(this).data("deli"), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "SCAN_CNT":$(this).find(".SCAN_BOX_CNT").text(), "INSP_FLAG":$(this).data("inspflag"),"OTHER_PLANT_MOVE_FLAG": other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
            });
        }

        $.each(Deli_List_Arr,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        $.each(Box_BarCode_Arr,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_IN_020_C1.do',
            data: {
                'param1': Deli_List_Arr,
                'param2': Box_BarCode_Arr
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    if(ORDR_NO!=""){
                        var query = 'DELETE FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'"';
                        M.db.execute(getUSER_ID, query, function(status, result, name) {
                            if(status == "FAIL") {
                                popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                                	title: $("[data-lng='MSG.0000000004']").text(),
                                	buttons:[$("[data-lng='MSG.0000000002']").text()]
                                }, function() {
                                	M.sys.exit();
                                });
                            }else{
                                moveToBack();
                            }
                        });
                    }else{
                        clear();
                    }
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    Deli_List_Arr.length = 0;
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                Deli_List_Arr.length = 0;
                saveflag = false;
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        console.log("clear");
        var query = 'DELETE FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'"';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            if(status == "FAIL") {
                popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                	title: $("[data-lng='MSG.0000000004']").text(),
                	buttons:[$("[data-lng='MSG.0000000002']").text()]
                }, function() {
                	M.sys.exit();
                });
            }
        });
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;
        over_chk = false;
        deli_flag = false;
        OTHER_FLAG = false;
        barcode_chk = true;
        deli_CASE = "";
        other_plant_flag = "Y";
        plant_cd = "";
        ORDR_NO = "";
        OP_CHECK = "";

        lp_box_no = "";
        lp_part_no = "";
        lp_box_qty = "";
        lp_box_lot_no = "";
        lp_box_BoxSeq = "";
        lp_box_Prt = "";
        lp_box_vendcd = "";

        C3_LIST.length = 0;
        C4_LIST.length = 0;
        Box_BarCode_Arr.length = 0;
        Deli_List_Arr.length = 0;
        Box_No_Arr.length = 0;

        $("#list_in_020").html("");
        $("#txtORDR_NO").text("");
        $("#txtVEND_CD").text("");
        $("#txtVEND_NM").text("");
        $("#list_in_020_head").addClass("blind");
        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selTOPLANT").attr("disabled",false);
        $("#selTOLOCTP").attr("disabled",false);
        $("#selDELI").addClass("blind");
        saveflag = false;
        $("#inputScan").focus();
    }

    // 가공 처리한 부품식별표 데이터
    var qrcode_callback = function(qrcode) {
        lp_box_no = qrcode.lp_Box_No();          // SCAN DATA BOX NO 추출
        lp_part_no = qrcode.lp_Box_PartNo();     // SCAN DATA PART_NO 추출
        lp_box_qty = qrcode.lp_Order_Qty();      // SCAN DATA BOX QTY 추출
        lp_box_lot_no = qrcode.lp_LotNo();       // SCAN DATA LOT_NO 추출
        lp_box_BoxSeq = qrcode.lp_BoxSeq();      // SCAN DATA Box Sequence 추출
        lp_box_Prt = qrcode.lp_Prt();            // SCAN DATA 출력 유형 추출
        lp_box_vendcd = qrcode.lp_Vendor();      // SCAN DATA VEND_CD 추출

        console.log("lp_box_no : "+ lp_box_no);
        console.log("lp_part_no : "+ lp_part_no);
        console.log("lp_box_qty : "+ lp_box_qty);
        console.log("lp_box_lot_no : "+ lp_box_lot_no);
        console.log("lp_box_BoxSeq : "+ lp_box_BoxSeq);
        console.log("lp_box_Prt : "+ lp_box_Prt);
        console.log("lp_box_vendcd : "+ lp_box_vendcd);
    }

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
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