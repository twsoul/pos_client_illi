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

    var LineAllOpt = "";
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

        // 플랜트 변경 시 원창, 현창, 라인 콤보박스 신규 호출
        $("#selPLANT").on("change", function() {
            selAllLine();
            StorageLocationReq("10");
            StorageLocationReq("20");
        });

        // 원창 변경 시 스캔 포커스
        $("#selLOCTP").on("change", function() {
            var query = 'SELECT BOXBAR, LINE FROM OUTBOX WHERE OUTTYPE = "31" AND PLANTCD = "'+$("#selPLANT").val()+'" AND LOCTP = "'+$("#selLOCTP").val()+'" ORDER BY CREATE_DT';
            M.db.execute(getUSER_ID, query, function(status, result,  name) {
                if(status == "FAIL") {
                    createTABLE();
                } else {
                    if(result.row_count > 0){
                        selectTABLE(result);
                    }
                }
            });
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
            deleteTABLE();
            clear();
        });
    };

    // 내부 DB 불출 스캔 CREATE 함수
    var createTABLE = function() {
        var query = 'CREATE TABLE IF NOT EXISTS OUTBOX (OUTTYPE TEXT NOT NULL, BOXBAR TEXT NOT NULL, PLANTCD TEXT, LOCTP TEXT, LINE TEXT, CREATE_DT TEXT DEFAULT (datetime(\'now\')), PRIMARY KEY(OUTTYPE,BOXBAR))';
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

    // 내부 DB 불출 스캔 CREATE 함수
    var deleteTABLE = function() {
        var query = 'DELETE FROM OUTBOX WHERE OUTTYPE = "31" AND PLANTCD = "'+$("#selPLANT").val()+'" AND LOCTP = "'+$("#selLOCTP").val()+'"';
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

    // 내부 DB 불출 스캔 SELECT 함수
    var selectTABLE = function(data) {
        var DBlist = [];
        $.each(data.row_list, function(index,rowData){
            DBlist.push(rowData.BOXBAR);
        });
        BoxNoScanTemp(DBlist,data);
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
                    selAllLine();
                    StorageLocationReq("10");
                    StorageLocationReq("20");
    		    }
    		}
    	});
    };

    // 원창, 현창 콤보박스 정보 조회
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
        	    if(type == "10") {
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
                    if($("#selLOCTP").val() != null){
                        var query = 'SELECT BOXBAR, LINE FROM OUTBOX WHERE OUTTYPE = "31" AND PLANTCD = "'+$("#selPLANT").val()+'" AND LOCTP = "'+$("#selLOCTP").val()+'" ORDER BY CREATE_DT';
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
        	    }
        	    if(type == "20") {
                    $("#selLOCTP2").html("");
                    if(receivedData.ListCount != 0){
                         $.each(receivedData.ListData, function(index,rowData){
                            tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                         });
                    }
                    $("#selLOCTP2").append(tag);
                }
        	}
        });
        $("#inputScan").focus();
    }

    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
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
        if(partNoProcessing(inputScan) == ""){
            popupManager.instance($("[data-lng='MSG.0000000228']").text(), {showtime:"LONG"}); // 바코드에 PART NO가 존재하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            sel_Line_Set(partNoProcessing(inputScan),inputScan);
        }
    }

    // 부품식별표 조회
    var BoxNoScanTemp = function(DBlist,data) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNoOutTemp.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val(),
                'BOX_BAR_NO': DBlist,
                'LANG':getLNG,
                'event':'임시데이터 조회'
            },
            success: function(receivedData, setting) {
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);
                $.each(receivedData.ListData, function(index,rowData){
                    if(DBlist.indexOf(rowData.BOX_BAR_NO) != -1){
                        DBlist.splice(DBlist.indexOf(rowData.BOX_BAR_NO),1);
                    }
                    if(rowData.LOC_TP_TYPE != 10){
                        var query = 'DELETE FROM OUTBOX WHERE OUTTYPE = "31" AND BOXBAR = "'+rowData.BOX_BAR_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if($("#selPLANT option:selected").attr('value2') == "Y" && rowData.ETC_OUT_CHK == "N"){
                        var query = 'DELETE FROM OUTBOX WHERE OUTTYPE = "31" AND BOXBAR = "'+rowData.BOX_BAR_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.BAR_QTY < 1){
                        var query = 'DELETE FROM OUTBOX WHERE OUTTYPE = "31" AND BOXBAR = "'+rowData.BOX_BAR_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else if(rowData.LIMIT_FLAG == "Y"){
                        var query = 'DELETE FROM OUTBOX WHERE OUTTYPE = "31" AND BOXBAR = "'+rowData.BOX_BAR_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else{
                        $("#txtTOTAL_QTY").text(rowData.TOTAL_QTY);
                        $("#txtPART_CD").text(rowData.PART_CD);
                        var tag = "";
                        var template = $("#ListTemplate").html();
                        tag += template.replace(/\{\{PART_NO\}\}/, rowData.PART_CD)
                                       .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                                       .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                                       .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                       .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                                       .replace(/\{\{PRE_INSP_DTTM\}\}/, rowData.PRE_INSP_DTTM)
                                       .replace(/\{\{FIFO_CHK\}\}/, rowData.FIFO_CHK)
                                       .replace(/\{\{FIFO_FLAG\}\}/, rowData.FIFO_FLAG)
                                       .replace(/\{\{item1\}\}/, LineAllOpt)
                                       .replace(/\{\{LB0000000038\}\}/, $("[data-lng='LB.0000000038']").text())  // 품번
                                       .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())  // 부품식별표
                                       .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text())  // 스캔수량
                                       .replace(/\{\{LB0000000156\}\}/, $("[data-lng='LB.0000000156']").text()); // 불출라인
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        var cnt = 0;
                        $("#list_ot_025 .tableCont").each(function() {
                            if($(this).find(".PART_NO").text() == rowData.PART_CD && $(this).data("fifoflag") < rowData.FIFO_FLAG){
                                cnt ++;
                            }
                        });
                        $("#list_ot_025").prepend(tag);
                        $.each(data.row_list, function(index2,rowData2){
                            if(rowData2.BOXBAR == rowData.BOX_BAR_NO){
                                $("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val(rowData2.LINE).prop("selected", true);
                                return false;
                            }
                        });
                        if(rowData.FIFO_CHK == "Y" && cnt < rowData.FIFO_FLAG){
                            $("#list_ot_025 .tableCont:eq(0)").data("fifo","Y");
                        }
                    }
                });
                if(DBlist.length > 0){
                    var query = ""
                    for(var i = 0; i < DBlist.length; i++ ) {
                        query += 'DELETE FROM OUTBOX WHERE OUTTYPE = "31" AND BOXBAR = "'+DBlist[i]+'";';
                    }
                    M.db.execute({
                        path:getUSER_ID,
                        sql:query,
                        multiple: true,
                        callback: function(status, result, name) {
                        }
                    });
                }
                //if($("#list_ot_020_1 .tableCont").length == 0) clear();
            }
        });
    };

    // 부품식별표 조회
    var BoxNoScan = function(box_barcode,line_exists,lineTag,lineVal) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNoOut.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val(),
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtTOTAL_QTY").text(rowData.TOTAL_QTY);
                $("#txtPART_CD").text(rowData.PART_CD);
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
                if (rowData.LIMIT_FLAG == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000701']").text(), {showtime:"LONG"}); // 유수명 기간이 만료되었습니다
                    $("#inputScan").focus();
                    return;
                }
                if($("#selPLANT option:selected").attr('value2') == "Y"){
                    if (rowData.ETC_OUT_CHK == "N") {
                        popupManager.instance($("[data-lng='MSG.0000000462']").text(), {showtime:"LONG"}); // 타용도 부품식별표입니다
                        $("#inputScan").focus();
                        return;
                    }
                }
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                var tag = "";
                var template = $("#ListTemplate").html();

                tag += template.replace(/\{\{PART_NO\}\}/, rowData.PART_CD)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                               .replace(/\{\{PRE_INSP_DTTM\}\}/, rowData.PRE_INSP_DTTM)
                               .replace(/\{\{FIFO_CHK\}\}/, rowData.FIFO_CHK)
                               .replace(/\{\{FIFO_FLAG\}\}/, rowData.FIFO_FLAG)
                               .replace(/\{\{LINE_EXISTS\}\}/, line_exists)
                               .replace(/\{\{item1\}\}/, lineTag)
                               .replace(/\{\{LB0000000038\}\}/, $("[data-lng='LB.0000000038']").text())  // 품번
                               .replace(/\{\{LB0000000120\}\}/, $("[data-lng='LB.0000000120']").text())  // 부품식별표
                               .replace(/\{\{LB0000000150\}\}/, $("[data-lng='LB.0000000150']").text())  // 스캔수량
                               .replace(/\{\{LB0000000156\}\}/, $("[data-lng='LB.0000000156']").text()); // 불출라인

                var cnt = 0;
                $("#list_ot_025 .tableCont").each(function() {
                    if($(this).find(".PART_NO").text() == rowData.PART_CD){
                        if($(this).data("fifoflag")<rowData.FIFO_FLAG){
                            cnt ++;
                        }
                    }
                });

                if(rowData.SEL_FLAG == "Y"){
                    popupManager.alert($("[data-lng='MSG.0000000463']").text(), { // 선택품입니다 그래도 저장하시겠습니까?
                    title: $("[data-lng='MSG.0000000004']").text(), // 알림
                    buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
                    }, function(index) {
                        if (index == 1){
                            $("#inputScan").focus();
                            return;
                        } else {
                            // 선입선출 위배 여부 처리
                            if(rowData.FIFO_CHK == "Y"){
                                if(cnt < rowData.FIFO_FLAG){
                                    popupManager.alert($("[data-lng='MSG.0000000333']").text(), { // 선입선출에 위배 되었습니다 그래도 저장하시겠습니까?
                                    title: $("[data-lng='MSG.0000000004']").text(), // 알림
                                    buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
                                    }, function(index) {
                                        if (index == 1){
                                            $("#inputScan").focus();
                                            return;
                                        } else {
                                            // 스캔시 플랜트, 원창 선택 불가
                                            $("#selPLANT").attr("disabled",true);
                                            $("#selLOCTP").attr("disabled",true);

                                            // 스캔마다 BOX 개수 증가
                                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                            $("#list_ot_025").prepend(tag);
                                            if(lineVal != ""){
                                                $("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val(lineVal).prop("selected", true);
                                            }
                                            var query = 'INSERT OR REPLACE INTO OUTBOX (OUTTYPE, BOXBAR, PLANTCD, LOCTP, LINE) values ("31","'+rowData.BOX_BAR_NO+'","'+$("#selPLANT").val()+'","'+$("#selLOCTP").val()+'","'+$("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val()+'")';
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
                                            $("#list_ot_025 .tableCont:eq(0)").data("fifo","Y");
                                            $("#inputScan").focus();
                                        }
                                    });
                                } else {
                                    // 스캔시 플랜트, 원창 선택 불가
                                    $("#selPLANT").attr("disabled",true);
                                    $("#selLOCTP").attr("disabled",true);
                                    // 스캔마다 BOX 개수 증가
                                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                    $("#list_ot_025").prepend(tag);
                                    if(lineVal != ""){
                                        $("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val(lineVal).prop("selected", true);
                                    }
                                    var query = 'INSERT OR REPLACE INTO OUTBOX (OUTTYPE, BOXBAR, PLANTCD, LOCTP, LINE) values ("31","'+rowData.BOX_BAR_NO+'","'+$("#selPLANT").val()+'","'+$("#selLOCTP").val()+'","'+$("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val()+'")';
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
                                    $("#inputScan").focus();
                                }
                            } else {
                                // 스캔시 플랜트, 원창 선택 불가
                                $("#selPLANT").attr("disabled",true);
                                $("#selLOCTP").attr("disabled",true);
                                // 스캔마다 BOX 개수 증가
                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                $("#list_ot_025").prepend(tag);
                                if(lineVal != ""){
                                    $("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val(lineVal).prop("selected", true);
                                }
                                var query = 'INSERT OR REPLACE INTO OUTBOX (OUTTYPE, BOXBAR, PLANTCD, LOCTP, LINE) values ("31","'+rowData.BOX_BAR_NO+'","'+$("#selPLANT").val()+'","'+$("#selLOCTP").val()+'","'+$("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val()+'")';
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
                                $("#inputScan").focus();
                            }
                        }
                    });
                } else {
                    // 선입선출 위배 여부 처리
                    if(rowData.FIFO_CHK == "Y"){
                        if(cnt != rowData.FIFO_FLAG){
                            popupManager.alert($("[data-lng='MSG.0000000333']").text(), { // 선입선출에 위배 되었습니다 그래도 저장하시겠습니까?
                            title: $("[data-lng='MSG.0000000004']").text(), // 알림
                            buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
                            }, function(index) {
                                if (index == 1){
                                    $("#inputScan").focus();
                                    return;
                                } else {
                                    // 스캔시 플랜트, 원창 선택 불가
                                    $("#selPLANT").attr("disabled",true);
                                    $("#selLOCTP").attr("disabled",true);

                                    // 스캔마다 BOX 개수 증가
                                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                    $("#list_ot_025").prepend(tag);
                                    if(lineVal != ""){
                                        $("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val(lineVal).prop("selected", true);
                                    }
                                    var query = 'INSERT OR REPLACE INTO OUTBOX (OUTTYPE, BOXBAR, PLANTCD, LOCTP, LINE) values ("31","'+rowData.BOX_BAR_NO+'","'+$("#selPLANT").val()+'","'+$("#selLOCTP").val()+'","'+$("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val()+'")';
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
                                    $("#list_ot_025 .tableCont:eq(0)").data("fifo","Y");
                                    $("#inputScan").focus();
                                }
                            });
                        } else {
                            // 스캔시 플랜트, 원창 선택 불가
                            $("#selPLANT").attr("disabled",true);
                            $("#selLOCTP").attr("disabled",true);

                            // 스캔마다 BOX 개수 증가
                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                            $("#list_ot_025").prepend(tag);
                            if(lineVal != ""){
                                $("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val(lineVal).prop("selected", true);
                            }
                            var query = 'INSERT OR REPLACE INTO OUTBOX (OUTTYPE, BOXBAR, PLANTCD, LOCTP, LINE) values ("31","'+rowData.BOX_BAR_NO+'","'+$("#selPLANT").val()+'","'+$("#selLOCTP").val()+'","'+$("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val()+'")';
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
                            $("#inputScan").focus();
                        }
                    } else {
                        // 스캔시 플랜트, 원창 선택 불가
                        $("#selPLANT").attr("disabled",true);
                        $("#selLOCTP").attr("disabled",true);

                        // 스캔마다 BOX 개수 증가
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        $("#list_ot_025").prepend(tag);
                        if(lineVal != ""){
                            $("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val(lineVal).prop("selected", true);
                        }
                        var query = 'INSERT OR REPLACE INTO OUTBOX (OUTTYPE, BOXBAR, PLANTCD, LOCTP, LINE) values ("31","'+rowData.BOX_BAR_NO+'","'+$("#selPLANT").val()+'","'+$("#selLOCTP").val()+'","'+$("#list_ot_025 .tableCont:eq(0)").find(".selLINE").val()+'")';
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
                        $("#inputScan").focus();
                    }
                }
            }
        });
    };

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

    var selAllLine = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LineCodeList.do',
            data: {
                'LANG': getLNG,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LINE_TYPE': '20',
                'event':'라인 정보 조회'
            },
            success: function(receivedData, setting) {
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                    console.log("LINE_CD : "+rowData.LINE_CD);
                });
                LineAllOpt = tag;
            }
        });
    }

    // 라인 콤보박스 정보 조회
    var sel_Line_Set = function(part_cd,barcode){
        var lineTag = "";
        var lineVal = "";
        var line_exists = "Y";
        $("#list_ot_025 .tableCont").each(function() {
            if($(this).find(".PART_NO").text() == part_cd){
                lineTag = $(this).find(".selLINE").html();
                lineVal = $(this).find(".selLINE").val();
                line_exists = $(this).data("lineexists");
                return false; // each문의 break;
            }
        });
        if(lineTag != ""){
            BoxNoScan(barcode,line_exists,lineTag,lineVal);
            return;
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LineCodeList.do',
            data: {
                'LANG': getLNG,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'PART_CD': part_cd,
                'LINE_TYPE': '20',
                'event':'라인 정보 조회'
            },
            success: function(receivedData, setting) {
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                    console.log("LINE_CD : "+rowData.LINE_CD);
                });
                lineTag = tag;
                BoxNoScan(barcode,line_exists,lineTag,lineVal);
            }
        });
        $("#inputScan").focus();
    }

    var line_change = function(obj){
        var box_bar_no = $(obj).parent().parent().parent().parent().parent().data("boxbarno");
        var query = 'UPDATE OUTBOX SET LINE = "'+$(obj).val()+'" WHERE OUTTYPE = "31" AND BOXBAR = "'+box_bar_no+'"';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
        });
        $("#inputScan").focus();
    }

    // 임시데이터 라인
    var selLineTemp = function(obj){
        var line_exists = $(obj).parent().parent().parent().parent().parent().data("lineexists");
        if(line_exists != "N" && line_exists != "Y"){
            var org_line = $(obj).val();
            var part_cd = $(obj).parent().parent().parent().siblings().find(".PART_NO").text();

            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/LineCodeList.do',
                data: {
                    'LANG': getLNG,
                    'PLANT_CD': $("#selPLANT option:selected").val(),
                    'PART_CD': part_cd,
                    'LINE_TYPE': '20',
                    'event':'라인 정보 조회'
                },
                success: function(receivedData, setting) {
                    $(obj).html("");
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                    });
                    $(obj).append(tag);
                    $(obj).val(org_line).prop("selected", true);
                    $(obj).click();
                }
            });
        }
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userLocTpCheck2 = $("#selLOCTP2").val();
        var Box_No_List = [];
        var plantChk = $("#selPLANT option:selected").attr('value1');
        var fifo = "N";
        var saveChk = true;
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck2 == null){
            popupManager.instance($("[data-lng='MSG.0000000246']").text(), {showtime:"LONG"}); // 현창을 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        $("#list_ot_025 .tableCont").each(function() {
            if($(this).data("fifo") == "Y"){
                fifo = "Y";
            }
            if(plantChk == "Y"){ // 라인 입력이 필수 인지 체크
                if($(this).find(".selLINE").val() != null){
                    Box_No_List.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_LOC_TP":$("#selLOCTP2").val(), "LINE_CD":$(this).find(".selLINE").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendcd"), "PART_CD":$(this).find(".PART_NO").text(), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "FIFO":fifo,"USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000504']").text(), {showtime:"LONG"}); // 라인정보를 입력해야 저장이 가능합니다
                    saveChk = false;
                }
            } else {
                Box_No_List.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_LOC_TP":$("#selLOCTP2").val(), "LINE_CD":$(this).find(".selLINE").val(), "BOX_NO":$(this).data("boxno"), "VENDOR_CD":$(this).data("vendcd"), "PART_CD":$(this).find(".PART_NO").text(), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "FIFO":fifo, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
            }
        });

        if(saveChk){ // 저장가능
            $.each(Box_No_List,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                $.each(value,function(key,value){
                    console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                });
            });

            save(Box_No_List);
        }
    }

    // PR_PDA_OT_025_C1 호출 및 저장
    var save = function(Box_No_List) {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_025_C1.do',
            data: {
                'param1': Box_No_List
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

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;
        $("#list_ot_025 .tableCont").each(function() {
            if($(this).data("boxno") == box_no){
                rtn = true;
                return false; // each문의 break;
            }
        });
        return rtn;
    };

    // 화면 초기화
    var clear = function() {
        $("#list_ot_025").html("");
        $("#txtBoxNo").text("");
        $("#txtDivBoxNo").text("");
        $("#inpBoxQty").text("0");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#txtTOTAL_QTY").text("0");
        $("#txtPART_CD").text("");
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
            $(".PRE_QTY").text(Number($(".SCAN_QTY").text()));
        } else if(preQty == 0){
            popupManager.instance($("[data-lng='MSG.0000000283']").text(), {showtime:"LONG"}); // 불출할 수량이 스캔수량과 같을경우 일반불출을 사용해 주십시오
            $(".DIV_QTY").val("0");
            $(".PRE_QTY").text(Number($(".SCAN_QTY").text()));
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