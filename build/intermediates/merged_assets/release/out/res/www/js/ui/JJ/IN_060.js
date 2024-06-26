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

    var Box_BarCode_Arr = [];
    var Box_No_Arr = [];
    var Deli_List_Arr = [];
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;
    var deli_flag = false; // 납입문서가 존재 하는지 체크 하는 flag
    var deli_loc_tp = false;
    var OTHER_FLAG = false;
    var box_bar_flag = false; // 부품식별표 바코드 유무 플래그
    var sPlant = "";
    var sLocTp = "";

    var PLANT_CD = "";
    var LOC_TP = "";
    var ORDR_NO = "";
    var PART_CNT = "";
    var STATUS = "";
    var VEND_NM = "";
    var VEND_CD = "";
    var DELI_BAR_NO = "";
    var plant_cd = "";
    var deli_CASE = "";
    var other_plant_flag = "Y";

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

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
                        tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.BOX_BAR_FLAG+ "' value2='" + rowData.INSP_FIND_YN +"'>" + rowData.TEXT + "</option>";
                        console.log(rowData.VALUE + " : "+ rowData.INSP_FIND_YN);
                    });
                    $("#selTOPLANT").append(tag);
                    $("#selPLANT").append(tag);

                    $("#selTOPLANT").val(getWERKS).prop("selected", true);

                    StorageLocationReq();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        if(!deli_loc_tp){
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
                }
            });
        }else{
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
            if(deli_flag == false) {
                if(!head_tail_chk(inputScan)){
                    deli_no = inputScan;
                }else{
                    deli_no = deliBarProcessing(inputScan);
                }
                console.log("deli_no : "+deli_no);
                Deli_No_Sel(deli_no);
            } else if(deli_flag == true) {
                if(box_bar_flag) { // 부품식별표 바코드가 존재 하지 않을 때
                    Box_No_Scan(inputScan);
                }else{
                    PartNoScan(inputScan);
                }

            }
        }
    }

    var deliBarProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:3SD004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:DN.{2,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
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

    // 납입 카드 정보 조회 함수
    var Deli_No_Sel = function(deli_bar_no){
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
                    popupManager.instance($("[data-lng='MSG.0000000129']").text(), {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_TYPE != "K"){
                    popupManager.instance($("[data-lng='MSG.0000000314']").text(), {showtime:"LONG"}); // 올바르지않은 납입문서입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_ST == "99"){
                    popupManager.instance($("[data-lng='MSG.0000000508']").text(), {showtime:"LONG"}); // 발행 취소된 납입카드 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_CASE == undefined){
                    popupManager.instance($("[data-lng='MSG.0000000495']").text(), {showtime:"LONG"}); // 납품유형이 누락되었습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.IN_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000273']").text(), {showtime:"LONG"}); // 이미 납입된 납입카드 번호입니다
                    $("#inputScan").focus();
                    return;
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
                    tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{DELI_NO\}\}/, rowData.DELI_NO)
                                   .replace(/\{\{DELI_TYPE\}\}/, rowData.DELI_TYPE)
                                   .replace(/\{\{DELI_CASE\}\}/, rowData.DELI_CASE)
                                   .replace(/\{\{DELI_ST\}\}/, rowData.DELI_ST)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                   .replace(/\{\{DELI_QTY\}\}/gi, rowData.DELI_QTY)
                                   .replace(/\{\{BOX_IN_QTY\}\}/, rowData.BOX_IN_QTY)
                                   .replace(/\{\{BOX_QTY\}\}/, rowData.BOX_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY)
                                   .replace(/\{\{OVER_QTY\}\}/, rowData.OVER_QTY == undefined ? 0 : rowData.OVER_QTY)
                                   .replace(/\{\{COLOR\}\}/, COLOR)
                                   .replace(/\{\{OTHER_PLANT_MOVE_FLAG\}\}/, rowData.OTHER_PLANT_MOVE_FLAG)
                                   .replace(/\{\{IN_YN\}\}/, rowData.IN_YN)
                                   .replace(/\{\{INSP_FLAG\}\}/, rowData.INSP_FLAG)
                                   .replace(/\{\{SCAN_BOX_CNT\}\}/, "0");
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
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selTOPLANT").val()){ //공장이 다를때
                    if(other_plant_flag == "N"){ //타공장 불허
                        popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                        $("#inputScan").focus();
                        clear();
                        return;
                    }else{
                        popupManager.alert($("[data-lng='MSG.0000000115']").text(), { // 타 공장 바코드입니다, 그래도 진행 하시겠습니까?
                        title: $("[data-lng='MSG.0000000004']").text(), // 알림
                        buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
                        }, function(index) {
                            if (index == 1){
                                clear();
                                return;
                            }else{
                                $("#selTOLOCTP").attr("disabled",true);
                                $("#selTOPLANT").attr("disabled",true);
                                $("#selDELI").removeClass("blind");
                                $("#selPLANT").val(rowData.PLANT_CD).prop("selected", true);
                                $("#selPLANT").attr("disabled",true);
                                deli_loc_tp = true;
                                OTHER_FLAG = true;
                                StorageLocationReq();
                                $("#list_in_060_head").removeClass("blind");
                                deli_flag = true;
                                deli_CASE = rowData.DELI_CASE;
                                plant_cd = rowData.PLANT_CD;
                                $("#list_in_060").append(tag);
                                $("#txtVEND_CD").text(rowData.VENDOR_CD);
                                $("#txtVEND_NM").text(rowData.VENDOR_NM);
                                $("#txtORDR_NO").text(rowData.DELI_NO);
                                // 부품식별표 바코드 유무 플래그
                                if($("#selPLANT option:selected").attr('value1') == "Y"){
                                    box_bar_flag = true;
                                } else {
                                    box_bar_flag = false;
                                }
                                popupManager.instance($("[data-lng='MSG.0000000499']").text() + rowData.DELI_CASE_NM, {showtime:"LONG"}); // 납품유형 :
                            }
                        })
                    }
                }else{
                    other_plant_flag = "N";
                    $("#selTOLOCTP").attr("disabled",true);
                    $("#selTOPLANT").attr("disabled",true);
                    $("#list_in_060_head").removeClass("blind");
                    deli_flag = true;
                    deli_CASE = rowData.DELI_CASE;
                    plant_cd = rowData.PLANT_CD;
                    $("#list_in_060").append(tag);
                    $("#txtVEND_CD").text(rowData.VENDOR_CD);
                    $("#txtVEND_NM").text(rowData.VENDOR_NM);
                    $("#txtORDR_NO").text(rowData.DELI_NO);
                    // 부품식별표 바코드 유무 플래그
                    if($("#selPLANT option:selected").attr('value1') == "Y"){
                        box_bar_flag = true;
                    } else {
                        box_bar_flag = false;
                    }
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

    // 부품식별표 바코드가 존재 하지 않을 경우 BOX_NO로 정보 조회
    var Box_No_Scan = function(box_no) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_060_S1.do',
            data: {
                'BOX_NO':box_no,
                'LANG':getLNG,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false; // 부품식별표가 리스트에 존재하는지 판단하는 플래그
                var bar_exists = false; // 부품식별표가 스캔되었는지 판단하는 플래그

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
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

                // 부품식별표가 이미 스캔 되었는지 확인
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

                $("#list_in_060 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".DELI_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                            over_chk = true;
                        }
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".DELI_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }
                        Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                            over_chk = true;
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        exists = true;
                        $(this).prependTo('div .list_in_060:eq(1)');
                    }
                });
                if(!exists){
                    Box_BarCode_Arr.pop();
                    popupManager.instance($("[data-lng='MSG.0000000271']").text(), {showtime:"LONG"}); // 납입카드에 해당 부품식별표가 존재 하지 않습니다
                    $("#inputScan").focus();
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
                    Box_BarCode_Arr.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":rowData.PLANT_CD,"LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(),"TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "INSP_FLAG":insp_flag, "OTHER_PLANT_MOVE_FLAG":other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                }
                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표별 품번 조회
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
                        $("#list_in_060 .tableCont").each(function() {
                            if($(this).data("partcd") == rowData.PART_CD){
                                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                                $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                                if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".DELI_QTY").text())){
                                    over_chk = true;
                                    $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                                }
                                if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".DELI_QTY").text())){
                                    $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                                }
                                Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                                } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                                    over_chk = true;
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                }
                                insp_flag = $(this).data("inspflag");
                                $(this).prependTo('div .list_in_060:eq(1)');
                            }
                        });
                        Box_No_Arr.push(rowData.BOX_NO);
                        Box_BarCode_Arr.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":rowData.PLANT_CD,"LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(),"TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "INSP_FLAG":insp_flag, "OTHER_PLANT_MOVE_FLAG":other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                    }
                });
                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표별 품번 조회
    var PartNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNoIn.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'BOX_BAR_NO':boxBarCode,
                'LANG':getLNG,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
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

                $("#list_in_060 .tableCont").each(function() {
                    if($(this).data("partcd") == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".DELI_QTY").text())){
                            over_chk = true;
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".DELI_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }
                        Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                            over_chk = true;
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        exists = true;
                        insp_flag = $(this).data("inspflag");
                        $(this).prependTo('div .list_in_060:eq(1)');
                    }
                });
                if(!exists){
                    Box_No_Arr.pop();
                    popupManager.instance($("[data-lng='MSG.0000000271']").text(), {showtime:"LONG"}); // 납입카드에 해당 부품식별표가 존재 하지 않습니다
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
                    Box_BarCode_Arr.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":rowData.PLANT_CD,"LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(),"TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "INSP_FLAG":insp_flag, "OTHER_PLANT_MOVE_FLAG":other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                }
                $("#inputScan").focus();
            }
        });
    }

    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(OTHER_FLAG){
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
            title: '미납 저장 여부 메시지',
            buttons: ['예', '아니오']
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    save();
                }
            });
        }else if(Tot_Scan_Qty > Tot_Deli_Qty || (Tot_Scan_Qty == Tot_Deli_Qty && over_chk == true)){
            popupManager.alert($("[data-lng='MSG.0000000275']").text(), { // 과납 되었습니다, 그래도 저장 하시겠습니까?
            title: '과납 저장 여부 메시지',
            buttons: ['예', '아니오']
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

    var save = function() {
        saveflag = true;
        if(OTHER_FLAG){
            $.each(Box_BarCode_Arr,function(key){
                Box_BarCode_Arr[key]['LOC_TP'] = $("#selLOCTP").val();
            });

            $("#list_in_060 .tableCont").each(function() {
                var PART_NM = $(this).data("partnm").replace(/\[/g,"^&")
                                                    .replace(/\]/g,"&^")
                                                    .replace(/\,/g,"^*")
                                                    .replace(/\=/g,"^%");
                Deli_List_Arr.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "TO_PLANT_CD":$("#selTOPLANT").val(), "TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text() ,"VENDOR_CD":$("#txtVEND_CD").text(),"VENDOR_NM":$("#txtVEND_NM").text(), "PART_CD":$(this).find(".PART_CD").text(), "PART_NM":PART_NM, "DELI_QTY":$(this).data("deliqty"), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "SCAN_CNT":$(this).find(".SCAN_BOX_CNT").text(), "INSP_FLAG":$(this).data("inspflag"),"OTHER_PLANT_MOVE_FLAG": other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
            });
        } else {
            $("#list_in_060 .tableCont").each(function() {
                var PART_NM = $(this).data("partnm").replace(/\[/g,"^&")
                                                    .replace(/\]/g,"&^")
                                                    .replace(/\,/g,"^*")
                                                    .replace(/\=/g,"^%");
                Deli_List_Arr.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$(this).data("plantcd"),"LOC_TP":"", "TO_PLANT_CD":$("#selTOPLANT").val(), "TO_LOC_TP":$("#selTOLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text() ,"VENDOR_CD":$("#txtVEND_CD").text(),"VENDOR_NM":$("#txtVEND_NM").text(), "PART_CD":$(this).find(".PART_CD").text(), "PART_NM":PART_NM, "DELI_QTY":$(this).data("deliqty"), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "SCAN_CNT":$(this).find(".SCAN_BOX_CNT").text(), "INSP_FLAG":$(this).data("inspflag"),"OTHER_PLANT_MOVE_FLAG": other_plant_flag,"WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
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
            path: 'api/PR_PDA_IN_060_C1.do',
            data: {
                'param1': Deli_List_Arr,
                'param2': Box_BarCode_Arr
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    Deli_List_Arr.length = 0;
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                Deli_List_Arr.length = 0;
                saveflag = false;
            }
        });
    }

    var clear = function() {
        console.log("clear");
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;
        over_chk = false;
        deli_flag = false;
        deli_loc_tp = false;
        OTHER_FLAG = false;
        box_bar_flag = false;
        deli_CASE = "";
        other_plant_flag = "Y";
        plant_cd = "";

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

        Box_BarCode_Arr.length = 0;
        Deli_List_Arr.length = 0;
        Box_No_Arr.length = 0;

        $("#list_in_060").html("");
        $("#txtORDR_NO").text("");
        $("#txtVEND_CD").text("");
        $("#txtVEND_NM").text("");
        $("#list_in_060_head").addClass("blind");
        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selTOPLANT").attr("disabled",false);
        $("#selTOLOCTP").attr("disabled",false);
        $("#selDELI").addClass("blind");
        saveflag = false;
        $("#inputScan").focus();
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