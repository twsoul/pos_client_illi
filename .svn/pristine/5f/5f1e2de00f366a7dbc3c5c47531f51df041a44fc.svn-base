/*******************************************************************
*	페이지 로직
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
    var deli_no = "";

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 화면 초기화시 플랜트 콤보박스 조회
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

        // 플랜트 변경 시 스캔으로 포커스
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
            $("#inputScan").focus();
        })

        // 저장위치 변경 시 스캔으로 포커스
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            deleteTABLE();
            clear();
        })
    };

    // 내부 DB 불출 스캔 CREATE 함수
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

    // 내부 DB 불출 스캔 CREATE 함수
    var deleteTABLE = function() {
        var query = 'DELETE FROM OUTPLT WHERE STEP = "SET" AND MOVENO = "'+$("#txtORDR_NO").text()+'" AND PLANTCD = "'+$("#selPLANT").val()+'" AND LOCTP = "'+$("#selLOCTP").val()+'"';
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

    // 내부 DB 불출 스캔 SELECT 함수
    var selectTABLE = function(data) {
        var DBlist = [];
        $.each(data.row_list, function(index,rowData){
            DBlist.push({"PLT_NO":rowData.PLTNO, "PART_CD":rowData.PARTCD,"DELI_QTY":rowData.DELIQTY});
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
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["50"]
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
        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if($("#txtORDR_NO").text() == ""){
                MoveNoScan(inputScan);
            } else if($("#txtLABEL").text() == ""){
                $("#txtLABEL").text(inputScan);
            } else {
                PalletScan(inputScan);
            }
        }
    }

    var MoveNoScan = function(move_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_230_S1.do',
            data: {
                'MOVE_NO':move_no,
                'event':'반출번호 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    var query = 'DELETE FROM OUTPLT WHERE STEP = "SET" AND MOVENO = "'+move_no+'" AND PLANTCD = "'+$("#selPLANT").val()+'" AND LOCTP = "'+$("#selLOCTP").val()+'"';
                    M.db.execute(getUSER_ID, query, function(status, result,  name) {
                    });
                    popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.MOVE_YN == "Y") {
                    var query = 'DELETE FROM OUTPLT WHERE STEP = "SET" AND MOVENO = "'+move_no+'" AND PLANTCD = "'+$("#selPLANT").val()+'" AND LOCTP = "'+$("#selLOCTP").val()+'"';
                    M.db.execute(getUSER_ID, query, function(status, result,  name) {
                    });
                    popupManager.instance($("[data-lng='MSG.0000000288']").text(), {showtime:"LONG"}); // 이미 반출된 반출번호입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 후 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_kd_230_head").removeClass("blind");
                    tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{MOVE_QTY\}\}/, rowData.MOVE_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, 0);
                   $("#list_kd_230").append(tag);
                   $("#txtORDR_NO").text(move_no);
                   // 전체 스캔 수량
                   Tot_Deli_Qty += parseInt(rowData.MOVE_QTY);
                });
                deli_no = rowData.DELI_NO;

                if($("#txtORDR_NO").text() != ""){
                    var query = 'SELECT PLTNO, PARTCD, DELIQTY FROM OUTPLT WHERE STEP = "SET" AND MOVENO = "'+$("#txtORDR_NO").text()+'" AND PLANTCD = "'+$("#selPLANT").val()+'" AND LOCTP = "'+$("#selLOCTP").val()+'" ORDER BY CREATE_DT';
                    M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        console.log("status : "+status);
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
    }


    // 임시데이터 조회
    var PalletScanTemp = function(DBlist) {
        $("#list_kd_230_head").removeClass("blind");
        $.each(DBlist, function(index,rowData){
            var template = $("#ListTemplate").html();
            var tag = "";
            var exists = false;

            $("#list_kd_230 .tableCont").each(function() {
                if($(this).find(".PART_CD").text() == rowData.PART_CD){
                    $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.DELI_QTY));

                    // 한 로우에 스캔 수량이 지시수량을 초과하는 경우
                    if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".MOVE_QTY").text())){
                        over_chk = true; // 과납 플래그 true 처리
                        $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                    }

                    // 한 로우에 스캔 수량이 지시수량과 일치하는 경우
                    if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".MOVE_QTY").text())){
                        $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                    }

                    Tot_Scan_Qty += parseInt(rowData.DELI_QTY);
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                    if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 총 지시수량과 스캔수량이 같은경우
                        $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                    } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 총 스캔수량이 지시 수량을 넘는 경우
                        over_chk = true; // 과납 플래그 true 처리
                        $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                    }
                    exists = true;
                    $(this).prependTo('div .list_kd_230:eq(1)');
                }
            });
            if(!exists){
                $("#inputScan").focus();
                return;
            }else{
                C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "DELI_NO":deli_no, "MOVE_NO":$("#txtORDR_NO").text(), "PLT_NO":rowData.PLT_NO, "USER_ID":getUSER_ID, "RTN_MSG":""});
            }
        });
        $("#inputScan").focus();
    };

    // 스캔 시 팔레트 조회
    var PalletScan = function(plt_no) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_230_S2.do',
            data: {
                'PLANT_CD':$("#selPLANT").val(),
                'DELI_NO':deli_no,
                'BAR_NO':$("#txtLABEL").text(),
                'PLT_NO':plt_no,
                'event':'팔레트 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                $("#txtLABEL").text("");

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }

                var plt_exists = false;

                // 팔레트트 중복 스캔 방지
                $.each(C1_LIST,function(key,value){
                    $.each(value,function(key,value){
                        if(value == plt_no){
                            plt_exists = true;
                        }
                    });
                });

                if(plt_exists){
                    popupManager.instance($("[data-lng='MSG.0000000394']").text(), {showtime:"LONG"}); // 이미 스캔한 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#list_kd_230_head").removeClass("blind");

                var template = $("#ListTemplate").html();
                var tag = "";
                var exists = false;

                $("#list_kd_230 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.DELI_QTY));

                        // 한 로우에 스캔 수량이 지시수량을 초과하는 경우
                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".MOVE_QTY").text())){
                            over_chk = true; // 과납 플래그 true 처리
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }

                        // 한 로우에 스캔 수량이 지시수량과 일치하는 경우
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".MOVE_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }

                        Tot_Scan_Qty += parseInt(rowData.DELI_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 총 지시수량과 스캔수량이 같은경우
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 총 스캔수량이 지시 수량을 넘는 경우
                            over_chk = true; // 과납 플래그 true 처리
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        exists = true;
                        $(this).prependTo('div .list_kd_230:eq(1)');
                    }
                });
                if(!exists){
                    popupManager.instance($("[data-lng='MSG.0000000543']").text(), {showtime:"LONG"}); // 품번이 리스트에 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }else{
                    var query = 'INSERT OR REPLACE INTO OUTPLT (STEP, MOVENO, DELINO, PLTNO, PARTCD, DELIQTY, PLANTCD, LOCTP) values ("SET","'+$("#txtORDR_NO").text()+'","'+deli_no+'","'+plt_no+'","'+rowData.PART_CD+'","'+rowData.DELI_QTY+'","'+$("#selPLANT").val()+'","'+$("#selLOCTP").val()+'")';
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
                    C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "DELI_NO":deli_no, "MOVE_NO":$("#txtORDR_NO").text(), "PLT_NO":plt_no, "USER_ID":getUSER_ID, "RTN_MSG":""});
                }
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

        if(Tot_Scan_Qty != Tot_Deli_Qty){
            popupManager.instance($("[data-lng='MSG.0000000630']").text(), {showtime:"LONG"}); // 문서의 지시수량과 스캔수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }else{
            save();
        }

    }

    // 저장 처리
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_230_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    deleteTABLE();
                    clear();
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

    // 화면 초기화
    var clear = function() {
        C1_LIST.length = 0;

        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;
        over_chk = false;
        deli_no = "";

        $("#txtLABEL").text("");
        $("#txtORDR_NO").text("");
        $("#list_kd_230").html("");
        $("#list_kd_230_head").addClass("blind");
        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
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