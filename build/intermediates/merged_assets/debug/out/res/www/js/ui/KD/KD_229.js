/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');
    var saveflag = false;

    var C1_LIST = [];
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;

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

        // 플랜트 변경 시 납입번호 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            clear();
            DeliNoComboReq();
        })

        // 납입번호 변경 시 리스트 재호출
        $("#selDELI_NO").on('change', function() {
            clear();
            DeliNoScan();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            deleteTABLE();
            clear();
            DeliNoScan();
        })
	};

    // 내부 DB Pallet 스캔 CREATE 함수
    var createTABLE = function() {
        var query = 'CREATE TABLE IF NOT EXISTS OUTPLT ( STEP TEXT NOT NULL, MOVENO TEXT, DELINO TEXT NOT NULL, PLTNO TEXT NOT NULL, PARTCD TEXT, DELIQTY TEXT, PLANTCD TEXT, LOCTP TEXT, CREATE_DT TEXT DEFAULT (datetime(\'now\')), PRIMARY KEY(STEP, DELINO, PLTNO))';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            if(status == "FAIL") {
                popupManager.alert($("[data-lng='MSG.0000000196']").text(), { // 데이터 베이스 생성에 실패하였습니다, 프로그램 종료합니다
                	title: $("[data-lng='MSG.0000000004']").text(), // 알람
                	buttons:[$("[data-lng='MSG.0000000002']").text()] //확인
                }, function() {
                	M.sys.exit();
                });
            }
        });
    };

    // 내부 DB Pallet 스캔 CREATE 함수
    var deleteTABLE = function() {
        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLANTCD = "'+$("#selPLANT").val()+'"';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            if(status == "FAIL") {
                popupManager.alert($("[data-lng='MSG.0000000196']").text(), { // 데이터 베이스 생성에 실패하였습니다, 프로그램 종료합니다
                	title: $("[data-lng='MSG.0000000004']").text(), // 알람
                	buttons:[$("[data-lng='MSG.0000000002']").text()]  //확인
                }, function() {
                	M.sys.exit();
                });
            }
        });
    };

    // 내부 DB Pallet 스캔 SELECT 함수
    var selectTABLE = function(data) {
        var DBlist = [];
        $.each(data.row_list, function(index,rowData){
            DBlist.push(rowData.PLTNO);
        });
        PalletScanTemp(DBlist);
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
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    DeliNoComboReq();
                }
            }
        });
    };

    // 납입번호 콤보박스 정보 조회
    var DeliNoComboReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_229_S1.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT").val(),
                'event':'반입 정보 조회'
            },
            success: function(receivedData, setting) {
                $("#selDELI_NO").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000706']").text(), {showtime:"LONG"}); // 납입번호 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.DELI_NO + "'>" + rowData.DELI_NO + "</option>";
                    });
                    $("#selDELI_NO").append(tag);
                    DeliNoScan();
                }
            }
        });
    };

    // 반입 정보 조회 함수
    var DeliNoScan = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_229_S2.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'DELI_NO':$("#selDELI_NO").val(),
                'event':'반입 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000706']").text(), {showtime:"LONG"}); // 납입번호 조회정보가 없습니다
                    $("#inputScan").focus();
                    return;
                }

                $("#list_kd_229_head").removeClass("blind");

                var template = $("#ListTemplate").html();
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{DELI_QTY\}\}/, rowData.DELI_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, 0);
                    Tot_Deli_Qty += parseInt(rowData.DELI_QTY);
                });
                $("#list_kd_229").append(tag);

                if($("#selDELI_NO").val() != null){
                    var query = 'SELECT PLTNO FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLANTCD = "'+$("#selPLANT").val()+'" ORDER BY CREATE_DT';
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

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(inputScan.length > 0) {
            PalletScan(inputScan);
        }
    }

    // 임시데이터 조회
    var PalletScanTemp = function(DBlist) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwPalletTemp.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'PLT_NO': DBlist,
                'event':'임시데이터 조회'
            },
            success: function(receivedData, setting) {
                $.each(receivedData.ListData, function(index,rowData){
                    if(DBlist.indexOf(rowData.PLT_NO) != -1){
                        DBlist.splice(DBlist.indexOf(rowData.PLT_NO),1);
                    }
                    if(rowData.PLT_LOC_CD != "B02"){
                        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+rowData.PLT_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.HOLD_FLAG == "Y"){
                        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+rowData.PLT_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.MAP_QTY < 1){
                        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+rowData.PLT_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.LIMIT_FLAG == "Y"){
                        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+rowData.PLT_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.READY_FLAG == "Y"){
                        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+rowData.PLT_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.PACK_FLAG == "N") {
                        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+rowData.PLT_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.RETURN_FLAG == "Y") {
                        var query = 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+rowData.PLT_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else{
                        $("#list_kd_229 .tableCont").each(function() {
                            if($(this).find(".PART_CD").text() == rowData.PART_CD){
                                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + rowData.MAP_QTY);

                                if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".DELI_QTY").text())){
                                    over_chk = true;
                                    $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                                }
                                if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".DELI_QTY").text())){
                                    $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                                }
                                Tot_Scan_Qty += rowData.MAP_QTY;
                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                                } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                                    over_chk = true;
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                }
                                $(this).prependTo('div .list_kd_229:eq(1)');

                                // 스캔 후 플랜트 선택 불가
                                $("#selPLANT").attr("disabled",true);

                                C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "DELI_NO":$("#selDELI_NO").val(), "PLT_NO":rowData.PLT_NO,  "USER_ID":getUSER_ID, "RTN_MSG":""});
                            }
                        });
                    }
                });
                if(DBlist.length > 0){
                    var query = ""
                    for(var i = 0; i < DBlist.length; i++ ) {
                        query += 'DELETE FROM OUTPLT WHERE STEP = "READY" AND DELINO = "'+$("#selDELI_NO").val()+'" AND PLTNO = "'+DBlist[i]+'";';
                    }
                    M.db.execute({
                        path:getUSER_ID,
                        sql:query,
                        multiple: true,
                        callback: function(status, result, name) {
                        }
                    });
                }
                if($("#list_kd_229 .tableCont").length == 0) clear();
                $("#inputScan").focus();
            }
        });
    };

    // Pallet 조회 함수
    var PalletScan = function(plt_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwPallet.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'PLT_NO':plt_no,
                'event':'Pallet 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLT_LOC_CD != "B02"){
                    popupManager.instance($("[data-lng='MSG.0000000708']").text(), {showtime:"LONG"}); // 출하할 수 없는 팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000667']").text(), {showtime:"LONG"}); // 보류된 TM이 존재하는 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.MAP_QTY < 1){
                    popupManager.instance($("[data-lng='MSG.0000000668']").text(), {showtime:"LONG"}); // 공팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LIMIT_FLAG == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000669']").text(), {showtime:"LONG"}); // 유수명이 만료된 TM이 존재합니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.READY_FLAG == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000707']").text(), {showtime:"LONG"}); // 이미 출하준비된 팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PACK_FLAG == "N") {
                    popupManager.instance($("[data-lng='MSG.0000000760']").text(), {showtime:"LONG"}); // 포장처리되지 않은 Pallet입니다
                    $("#inputScan").focus();
                    return;
                }
                var exists = false;

                // Pallet 중복 스캔 방지
                $.each(C1_LIST,function(key,value){
                      $.each(value,function(key,value){
                            if(value == plt_no){
                                exists = true;
                            }
                      });
                 });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000394']").text(), {showtime:"LONG"}); // 이미 스캔한 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }

                var part_yn = false;
                $("#list_kd_229 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + rowData.MAP_QTY);

                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".DELI_QTY").text())){
                            over_chk = true;
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".DELI_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }
                        Tot_Scan_Qty += rowData.MAP_QTY;
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                            over_chk = true;
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        $(this).prependTo('div .list_kd_229:eq(1)');
                        part_yn = true;

                        // 스캔 후 플랜트, 저장위치,  사외창고 선택 불가
                        $("#selPLANT").attr("disabled",true);

                        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "DELI_NO":$("#selDELI_NO").val(), "PLT_NO":plt_no,  "USER_ID":getUSER_ID, "RTN_MSG":""});
                    }
                });

                if(!part_yn){
                    popupManager.instance($("[data-lng='MSG.0000000543']").text(), {showtime:"LONG"}); // 품번이 리스트에 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                var query = 'INSERT OR REPLACE INTO OUTPLT (STEP, DELINO, PLTNO, PLANTCD) values ("READY","'+$("#selDELI_NO").val()+'","'+plt_no+'","'+$("#selPLANT").val()+'")';
                M.db.execute(getUSER_ID, query, function(status, result, name) {
                    console.log("status : "+status);
                    console.log("result : "+result);
                    console.log("name : "+name);
                    if(status == "FAIL") {
                        popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                            title: $("[data-lng='MSG.0000000004']").text(),
                            buttons:[$("[data-lng='MSG.0000000002']").text()]
                        }, function() {
                            M.sys.exit();
                        });
                    }
                });
                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Deli_Qty != Tot_Scan_Qty || over_chk == true){
            popupManager.instance($("[data-lng='MSG.0000000630']").text(), {showtime:"LONG"}); // 문서의 지시수량과 스캔수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }

        save();
    }

    var save = function() {
    saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_229_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    deleteTABLE();
                    clear();
                    DeliNoComboReq();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                saveflag = false;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_229").html("");
        $("#list_kd_229_head").addClass("blind");

        C1_LIST.length = 0;
        Tot_Scan_Qty = 0;
        Tot_Deli_Qty = 0;
        over_chk = false;

        $("#selPLANT").attr("disabled",false);

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        saveflag = false;
        $("#inputScan").focus();
    }

	var moveToBack = function() {
		screenManager.moveToBack();
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