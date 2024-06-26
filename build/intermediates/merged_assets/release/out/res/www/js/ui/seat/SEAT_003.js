/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
//    var getCORP_CD = userManager.getCORP_CD();
//    var getUSER_NM = userManager.getUSER_NM();
//    var getUSER_ID = userManager.getUSER_ID();
//    var getWERKS = optionManager.getWERKS();
//    var getLGORT = optionManager.getLGORT();
//    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    // 부품식별표 바코드 Processing
    var lp_box_no = "";
    var lp_part_no = "";
    var lp_box_qty = "";
    var lp_box_lot_no = "";
    var lp_box_BoxSeq = "";
    var lp_box_Prt = "";
    var lp_box_vendcd = "";

    var blockMultiTap = false;          // 리스트 중복 탭 방지 플래그
    var other_plant_chk_flag = "N";     // 타 공장 여부를 납입 카드로 넘겨주는 플래그
    var reloadFlag = false;             // 리 로딩 플래그
    var pack_plant = "";                // PACK_DELI_NO 바코드 플랜트
    // 스캔 순서로직
    var map_arr = [];
    var scan_current_part,scan_current_poNum,scan_current_poSel,scan_current_poSeq;

    var deli_no, num_5j, pallet_type, pallet_pos,scan_YN ="";
    var bcMode_change = "";

	// 화면 초기화
	var setInitScreen = function() {
        //;
	    deli_no = dataManager.param("DELI_NO");
	    num_5j = dataManager.param("NUM_5J");
	    pallet_type = dataManager.param("PALLET_TYPE");
	    pallet_pos= dataManager.param("PALLET_POS");
	    //scan_YN= dataManager.param("SCAN_YN");
	    // 5J 스캔 여부
	    scan_YN = "X";

    //debugger;
	    if(scan_YN =="O"){
	        //스캔
            $("#palletHeader").css({
                "background": "#00FF00"
            });
	    } else if(scan_YN =="X"){
            //스캔 안됨
            $("#palletHeader").css({
                "background": "#FFFFFF"
            });
            /*$("#palletHeader").css({
                "background": "#00FF00"
            });*/
	    }

        // LR 모드 shared
		bcMode_change = getPreferences("pda_sorting_Mode","bcModeLR","LLRR");
		//쉐어드에 따라서 스피너 선택
		$("#barcode_mode_LR").val(bcMode_change).prop("selected", true);

	    //Master
	    $("#pallet_pos").val(pallet_pos);
	    $("#pallet_type").val(pallet_type);
	    $("#num_5j").val(num_5j);
	    $("#scan_YN").val();

	    deli_list_select_3(deli_no, num_5j, pallet_type);

        $("#inputScan").focus();
	};

    $("#barcode_mode_LR").on("change",function(){
        setPreferences("pda_sorting_Mode","bcModeLR", $("#barcode_mode_LR option:selected").val());
        bcMode_change = getPreferences("pda_sorting_Mode","bcModeLR","LLRR");
        // 선택시 바로 변경
        deli_list_select_3(deli_no, num_5j, pallet_type);
    })

    $("#header").on("click", function() {
    //deli_list_select_3(deli_no, num_5j, pallet_type);
            });
	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();

                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    //ScanValidation(inputScan);
                    ScanLogic(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // input Focus
        $("#pallet_pos").on("click", function() { $("#inputScan").focus(); });
        $("#pallet_type").on("click", function() { $("#inputScan").focus(); });
        $("#num_5j").on("click", function() { $("#inputScan").focus(); });

        $("#btnScan").on("click", function() { $("#inputScan").focus(); });
        $("#list_SEAT_003_CH_head").on("click", function() { $("#inputScan").focus(); });
        $("#list_SEAT_003_BH_head").on("click", function() { $("#inputScan").focus(); });

        $('#inputScan').blur(function(e){
            $("#inputScan").focus();
        });
    };

    // 풀바코드 넘길거임.
    var  barcode_valid = "";
    //popupManager.alert($("[data-lng='MSG.0000000115']").text(), { // 타 공장 바코드입니다, 그래도 진행 하시겠습니까?
    var ScanLogic = function(inputScan){
        //debugger;
        console.log("BARCODE:"+ inputScan);
        console.log("rivianPart:"+ scan_current_part);
        console.log("poNum:"+ scan_current_poNum);
        console.log("poSel:"+ scan_current_poSel);
        console.log("poSeq:"+ scan_current_poSeq);
        console.log("num5j:"+ num_5j);
        console.log("palletType:"+ pallet_type);
        // 공백 있는 바코드
        barcode_valid = inputScan.replace(/^\s+/,"");

        var test = barcode_valid.substring(0,16);
        debugger;
        if((inputScan.substring(0,2) == "5J" || inputScan.substring(0,2) == "2J")&& inputScan == num_5j){
            scan_YN = "O";
            $("#palletHeader").css({
                "background": "#00FF00"
            });
            $("#inputScan").focus();
            play_sound("OK");
        }
        // 1. scan_YN = "X"인데, 5J/2J 바코드 먼저 안찍었을 때
        else if(scan_YN == "X" && !(inputScan.substring(0,2) == "5J" || inputScan.substring(0,2) == "2J")){
            popupManager.alert("Scan the 5J / 2J barcode first", { title: 'NG' });
            //popupManager.instance("Scan the 5J / 2J barcode first", {showtime:"LONG"}); // 5J / 2J 바코드를 먼저 찍어라
            $("#inputScan").focus();
            play_sound("NG");
        }else if(scan_YN == "X" && inputScan != num_5j){
            popupManager.alert("Scan the correct 5J/2J barcode", { title: 'NG' });
            //popupManager.instance("Scan the correct 5J/2J barcode", {showtime:"LONG"}); // 올바른 5J/2J 바코드를 스캔해야 합니다
            $("#inputScan").focus();
            play_sound("NG");
        }
        // 5j 스캔완료 && 지금 스캔할 차례가 맞는지, 품번 비교 (
        else if (scan_YN == "O" && barcode_valid.substring(0,16) == scan_current_part ){
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/PR_PDA_BARCODE_CHK.do',
                data: {
                    'BARCODE': inputScan
                    ,'rivianPart': scan_current_part
                    ,'poNum': scan_current_poNum
                    ,'poSel': scan_current_poSel
                    ,'poSeq': scan_current_poSeq
                    ,'num5j': num_5j
                    ,'palletType' : pallet_type
                },
                success: function(receivedData, setting) {
                    //스캔 완료
                    if(receivedData.RESULT =="OK"){
                       if(receivedData.RTN_MSG =="PALLET ALL COMPLETE"){
                            // 2 페이지에서 자동 모드로 변환 OK: auto / NG: NonAuto
                            screenManager.moveToPage("SEAT_002.html", {
                                action: 'CLEAR_TOP'
                                ,param: {
                                    Complete: M.sec.encrypt("OK").result
                                }
                            });
                       }
                       // 바코드 스캔 모두 완료
                       else if(receivedData.RTN_MSG =="ALL COMPLETE"){
                            // 2 페이지에서 자동 모드로 변환 OK: auto / NG: NonAuto
                            screenManager.moveToPage("SEAT_002.html", {
                                action: 'CLEAR_TOP'
                                ,param: {
                                    Complete: M.sec.encrypt("ALL_OK").result
                                }
                            });
                       }
                       else{
                        deli_list_select_3(deli_no, num_5j, pallet_type);
                        // ok 사운드 충돌 문제때문에, instance 제거
                        //popupManager.instance(receivedData.RTN_MSG, {showtime:"LONG"});
                        $("#inputScan").focus();
                       }
                    play_sound("OK");
                    // SCAN 에러
                    }else if(receivedData.RESULT =="NG"){
                        popupManager.alert(receivedData.RTN_MSG, { title: 'NG' });
                        play_sound("NG");
                    }

                },
                error: function(errorCode, errorMessage, settings) {
                    popupManager.alert(errorMessage, { title: errorCode });
                    C1_LIST.length = 0;
                    saveflag = false;
                }
            });
            //$("#inputScan").focus();
        }else {
            //popupManager.instance("Scan the correct barcode", {showtime:"LONG"}); // 올바른 바코드를 스캔해야 합니다
            popupManager.alert("Scan the correct barcode", { title: 'NG' });
            play_sound("NG");
            $("#inputScan").focus();
        }
        $("#inputScan").focus();
    }


    // 부품식별표 head, tail 체크
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

    //바코드 스캔 순서 체크

    // deli_no 조회
    // 스캔 순서 로직 추가
    var cursor_index = "";
    var deli_list_select_3 = function(deli_no, num_5j, pallet_type){
    map_arr = [];
    if(pallet_type == "BH"){
                // BH 백 ListTemplate_BH
                    networkManager.httpSend({
                        server: saveUserCo,
                        path: 'api/DELI_NO_LIST_3_BH.do',
                        data: {
                            'location':"B"
                            ,'deliNo': deli_no
                            ,'num5j': num_5j
                        },
                        success: function(receivedData, setting) {
                            var rowData = receivedData.ListData[0];

                            if(receivedData.ListCount == 0){
                                popupManager.instance($("[data-lng='MSG.0000000129']").text(), {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                                //$("#inputScan").focus();
                                return;
                            }


                            var tag = "";
                            var template = $("#ListTemplate_BH").html();

                            $.each(receivedData.ListData, function(index,rowData){
                                //스캔 순서 로직 추가
                                map_arr.push([index
                                ,"LH"
                                ,rowData.LH_COLOR_NM
                                ,rowData.LH_RIVIAN
                                ,rowData.LH_SCAN_CHK
                                ,rowData.PO_NUM
                                ,rowData.PO_SEL
                                ,rowData.PO_SEQ]);

                                map_arr.push([index
                                ,"RH"
                                ,rowData.LH_COLOR_NM
                                ,rowData.RH_RIVIAN
                                ,rowData.RH_SCAN_CHK
                                ,rowData.PO_NUM
                                ,rowData.PO_SEL
                                ,rowData.PO_SEQ]);

                                tag += template.replace(/\{\{LH_COLOR_NM\}\}/gi, rowData.LH_COLOR_NM)
                                               .replace(/\{\{LH_RIVIAN\}\}/gi, rowData.LH_RIVIAN)
                                               .replace(/\{\{RH_RIVIAN\}\}/gi, rowData.RH_RIVIAN)
                                               .replace(/\{\{LH_SCAN_CHK\}\}/gi, rowData.LH_SCAN_CHK)
                                               .replace(/\{\{RH_SCAN_CHK\}\}/gi, rowData.RH_SCAN_CHK)
                                               .replace(/\{\{PO_NUM\}\}/gi, rowData.PO_NUM)
                                               .replace(/\{\{PO_SEL\}\}/gi, rowData.PO_SEL)
                                               .replace(/\{\{PO_SEQ\}\}/gi, rowData.PO_SEQ)

                                               .replace(/\{\{INDEX\}\}/gi, index.toString())
                                               .replace(/\{\{INDEX_CNT\}\}/gi, (index+1).toString())
//                                               .replace(/\{\{LH_INDEX\}\}/gi, (index * 2))
//                                               .replace(/\{\{RH_INDEX\}\}/gi, ((index * 2) + 1))
                                               .replace(/\{\{LH_INDEX\}\}/gi, "LH"+ index,toString())
                                               .replace(/\{\{RH_INDEX\}\}/gi, "RH"+ index,toString())

                                               .replace(/\{\{MLINK\}\}/, "mLink"
                                               );
                            });
                            //스캔 순서 로직
                            barcode_scan_seq(map_arr,"BH");
                            //$("#txtORDR_NO").text(deli_bar_no);
                            $("#list_SEAT_003_BH").html("");
                            $("#list_SEAT_003_BH_head").removeClass("blind");
                            $("#list_SEAT_003_BH").removeClass("blind");
                            $("#list_SEAT_003_BH").append(tag);
                            setListRowEvent();
                            $("#INDEX"+ cursor_index).css({
                            // 아이보리색
                                "background": "#FFDEAD"
                            });
                            $("#inputScan").focus();
                        }
                    });
    }else if(pallet_type == "CH"){
            // CH 쿠션  ListTemplate_CH
                networkManager.httpSend({
                    server: saveUserCo,
                    path: 'api/DELI_NO_LIST_3.do',
                    data: {
                        'location':"B"
                        ,'deliNo': deli_no
                        ,'num5j': num_5j
                    },
                    success: function(receivedData, setting) {
                        var rowData = receivedData.ListData[0];

                        if(receivedData.ListCount == 0){
                            popupManager.instance("Server Connection Error", {showtime:"LONG"});
                            //$("#inputScan").focus();
                            return;
                        }


                        var tag = "";
                        var template = $("#ListTemplate_CH").html();

                        $.each(receivedData.ListData, function(index,rowData){
                            //스캔 순서 로직 추가
                            map_arr.push([index
                                ,"AL"
                                ,rowData.COLOR_NM
                                ,rowData.RIVIAN
                                ,rowData.SCAN_CHK
                                ,rowData.PO_NUM
                                ,rowData.PO_SEL
                                ,rowData.PO_SEQ]);

                            tag += template.replace(/\{\{COLOR_NM\}\}/gi, rowData.COLOR_NM)
                                           .replace(/\{\{RIVIAN\}\}/gi, rowData.RIVIAN)
                                           .replace(/\{\{SCAN_CHK\}\}/gi, rowData.SCAN_CHK)
                                           .replace(/\{\{PO_NUM\}\}/gi, rowData.PO_NUM)
                                           .replace(/\{\{PO_SEL\}\}/gi, rowData.PO_SEL)
                                           .replace(/\{\{PO_SEQ\}\}/gi, rowData.PO_SEQ)
                                           .replace(/\{\{INDEX\}\}/gi, "AL"+ index.toString())
                                           .replace(/\{\{INDEX_CNT\}\}/gi, (index+1).toString())
                                           .replace(/\{\{MLINK\}\}/, "mLink"
                                           );
                        });

                        //스캔 순서 로직
                        barcode_scan_seq(map_arr,"CH");
                        //$("#txtORDR_NO").text(deli_bar_no);
                        $("#list_SEAT_003_CH").html("");
                        $("#list_SEAT_003_CH_head").removeClass("blind");
                        $("#list_SEAT_003_CH").append(tag);

                        setListRowEvent();
                        // 아이보리색
                            $("#INDEX"+cursor_index).css({
                                "background": "#FFDEAD"
                            });


                        $("#inputScan").focus();
                    }
                });
    }

    }

    var barcode_scan_seq = function(map_arr, bh_or_ch){
        //BH LH-LH / LH-RH 모드 선택에 따라, 로직 추가해야함
        // 현재는 LH-RH 모드
        // LLRR 로직
        bcMode_change = getPreferences("pda_sorting_Mode","bcModeLR","LLRR");
        debugger;
        if(bh_or_ch == "BH" && bcMode_change == "LLRR"){
            map_arr.sort((a, b) => a[1].localeCompare(b[1]) || a[0] < b[0]);
        }
        for(var i =0; i < map_arr.length; i++){
              if(map_arr[i][4] == 'X'){
                  scan_current_part = map_arr[i][3];
                  scan_current_poNum = map_arr[i][5]; // PO_NUM
                  scan_current_poSel = map_arr[i][6]; // PO_SEL
                  scan_current_poSeq = map_arr[i][7]; // PO_SEQ
                  //debugger;
                  //index로 커서 색상 변경
                  //index cursor => LH_index / RH_index로 변경
                  //cursor_index = i.toString();
                  cursor_index = map_arr[i][1]+ map_arr[i][0].toString() ;


                  break;
              }
        }
    }

    var setClearClickEvent = function(){
        clear();
    }

    // 화면 초기화
    var clear = function() {
        $("#list_in_010").html("");

        $("#list_in_010_head").addClass("blind");
        $("#txtORDR_NO").text("");

        lp_box_no = "";
        lp_part_no = "";
        lp_box_qty = "";
        lp_box_lot_no = "";
        lp_box_BoxSeq = "";
        lp_box_Prt = "";
        lp_box_vendcd = "";

        blockMultiTap = false; // 리스트 중복 탭 방지 플래그
        other_plant_chk_flag = "N"; // 타 공장 여부를 납입 카드로 넘겨주는 플래그
        reloadFlag = false;

        $("#inputScan").focus();
    }


	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
	    if(reloadFlag){
	        // 화면 초기화 후 리로딩
            blockMultiTap = false;
            reloadFlag = false;

//            $("#list_in_010").html("");
//            $("#list_in_010_head").addClass("blind");
//
//            DeliBarScan($("#txtORDR_NO").text(),pack_plant);

//            $("#inputScan").focus();
	    }
            $("#inputScan").focus();
	};

    var rivianPart_clickEvent;
    var poNum_clickEvent;
    var poSel_clickEvent;
    var poSeq_clickEvent;
	// 리스트에 클릭 이벤트 등록
    var setListRowEvent = function(){
        $(".mLink").off("click","**");
        $(".mLink").on("click", function(){
            if(!blockMultiTap){ // 중복 리스트 클릭 방지
                rivianPart_clickEvent = $(this).find(".RIVIAN_PART").text();
                poNum_clickEvent = $(this).find(".PO_NUM").text();
                poSel_clickEvent = $(this).find(".PO_SEL").text();
                poSeq_clickEvent = $(this).find(".PO_SEQ").text();

                blockMultiTap = true;
                reloadFlag = true;
                if(scan_YN =="O"){
                    popupManager.alert("Pass or Clear", { //
                    title: rivianPart_clickEvent,
                    //buttons: ['Clear', 'Cancel','Pass']
                    //buttons: ['Pass', 'Clear','Cancel']
                    buttons: ['Cancel', 'Pass','Clear']
                    }, function(index) {
                        // 1. Clear
                        if (index == 2){
                            PR_PDA_PASS_CLEAR("CLEAR",rivianPart_clickEvent,poNum_clickEvent,poSel_clickEvent,poSeq_clickEvent);
                        }
                        // 2. Cancel
                        else if (index == 0){
                            popupManager.instance("Cancel", {showtime:"LONG"});
                        }
                        // 0. Pass 시, 정말 패스 할건지 확인
                        else if(index == 1){
                            popupManager.alert("Do you want to pass?", { //
                            title: "Pass: "+ rivianPart_clickEvent,
                            buttons: ['Cancel', 'OK' ]
                            }, function(index) {
                                // Cancel
                                if (index == 0){
                                    popupManager.instance("Cancel", {showtime:"LONG"});
                                // OK
                                } else {
                                    PR_PDA_PASS_CLEAR("PASS",rivianPart_clickEvent,poNum_clickEvent,poSel_clickEvent,poSeq_clickEvent);
                                    //popupManager.instance("Ok", {showtime:"LONG"});
                                }
                            });

                        }
                            $("#inputScan").focus();
                            blockMultiTap = false;

                    });
                }else {
                    popupManager.alert("Scan the 5J / 2J barcode first", { title: 'NG' });
                    $("#inputScan").focus();
                    play_sound("NG");
                    blockMultiTap = false;
                }


            }
        })
    };

    var PR_PDA_PASS_CLEAR = function(pass_or_clear,rivianPart,poNum,poSel,poSeq){
         networkManager.httpSend({
                        server: saveUserCo,
                        path: 'api/PR_PDA_PASS_CLEAR.do',
                        //path: 'api/PROC_CALL.do',
                        data: {
                            'PassOrClear': pass_or_clear
                            ,'rivianPart': rivianPart
                            ,'poNum': poNum
                            ,'poSel': poSel
                            ,'poSeq': poSeq
                            ,'num5j': num_5j
                            ,'palletType' : pallet_type
                        },
                        success: function(receivedData, setting) {
                            if(receivedData.RESULT =="OK"){
                               if(receivedData.RTN_MSG =="PALLET ALL COMPLETE"){
                                    // 2 페이지에서 자동 모드로 변환 OK: auto / NG: NonAuto
                                    screenManager.moveToPage("SEAT_002.html", {
                                        action: 'CLEAR_TOP'
                                        ,param: {
                                            Complete: M.sec.encrypt("OK").result
                                        }
                                    });
                               }
                               // 바코드 스캔 모두 완료
                               else if(receivedData.RTN_MSG =="ALL COMPLETE"){
                                    // 2 페이지에서 자동 모드로 변환 OK: auto / NG: NonAuto
                                    screenManager.moveToPage("SEAT_002.html", {
                                        action: 'CLEAR_TOP'
                                        ,param: {
                                            Complete: M.sec.encrypt("ALL_OK").result
                                        }
                                    });
                               }
                               else{
                                deli_list_select_3(deli_no, num_5j, pallet_type);
                                // ok 사운드 충돌 문제때문에, instance 제거
                                //popupManager.instance(receivedData.RTN_MSG, {showtime:"LONG"});
                                $("#inputScan").focus();
                               }
                               play_sound("OK");
                            // SCAN 에러
                            }else if(receivedData.RESULT =="NG"){
                                popupManager.alert(receivedData.RTN_MSG, { title: 'NG' });
                                play_sound("NG");
                            }

                            //화면 초기화
                            //deli_list_select_3(deli_no, num_5j, pallet_type);

                        },
                        error: function(errorCode, errorMessage, settings) {
                            //popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                            //
                            popupManager.alert(errorMessage, { title: errorCode });
                            C1_LIST.length = 0;
                            saveflag = false;
                        }
                    });
    }

    // DELI_NO가 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(deli_no){
        var rtn = false;
        $("#list_in_010 .tableCont").each(function() {
            if($(this).data("delino") == deli_no){
                rtn = true;
                return false; // each 문의 break;
            }
        });
        return rtn;
    };

	var moveToBack = function() {
		//screenManager.moveToBack();
            screenManager.moveToPage("SEAT_002.html", {
                action: 'CLEAR_TOP'
                ,param: {
                    Complete: M.sec.encrypt("NG").result
                }
            });
	};
    $("#btn_back").on("click", function(){
		//screenManager.moveToBack();
            screenManager.moveToPage("SEAT_002.html", {
                action: 'CLEAR_TOP'
                ,param: {
                    Complete: M.sec.encrypt("NG").result
                }
            });
	});
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