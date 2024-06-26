/*******************************************************************
*	페이지 로직
1. 스캔 안하고 자동으로 OUT_DIV 작은 순서대로 3번째 화면 호출
2. 리로드(setReloadEvent) 시 화면 리셋 후 리스트에서 OUT_DIV
    2-1. BBCC or BCBC 순서로 OUT_DIV 1, 2인 것 -> 3번째 화면 호출출*******************************************************************/

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

    var deli_no,bcMode, bcMode_change ="";

    // 3번 화면 호출 타이머
    var screen3rd_callTimer, refresh_Timer;
    var auto_mode = "NonAuto";
    var complete_3rd = "";

    var refresh_time;


	// 화면 초기화
	var setInitScreen = function() {
	    // 1. refresh 시간 db에서 받아오기
	    // 2. auto 모드는 기본적으로 NonAuto
	    //auto_mode = "NonAuto";
		//bcMode = $("#barcode_mode option:selected").val();

		//bcMode_change = getPreferences("pda_sorting_Mode","bcMode","BCBC");
		//쉐어드에 따라서 스피너 선택
		//$("#barcode_mode").val(bcMode_change).prop("selected", true);

	    //deli_no = dataManager.param("DELI_NO");
	     //$("#deliNoTitletxt").val(deli_no);

	    //complete_3rd = dataManager.param("Complete");
	    //if(complete_3rd == "OK"){
	    //    auto_mode = "auto";
	    //}


        deli_list_select(deli_no);
//        $("#inputScan").focus();
	};

    $("#barcode_mode").on("change",function(){
        setPreferences("pda_sorting_Mode","bcMode", $("#barcode_mode option:selected").val());
        bcMode_change = getPreferences("pda_sorting_Mode","bcMode","BCBC");
    })
    $("#header").on("click", function() {
    //bcMode = $("#barcode_mode option:selected").val();
    //deli_list_select(deli_no);
            });
	// 이벤트 초기화
	var setInitEvent = function() {
	    // 1. 1화면 -> 2화면 NonAuto
	    // 2. 3화면 -> 2화면 (취소,작업완료가 안되었을 때) NonAuto
	    // 3. 3화면 -> 2화면 (작업 다되었을때) Auto
	    //auto_timer();

        $("#inputScan").on('keypress', function (e) {
        debugger;
            if (e.key === 'Enter' || e.keyCode === 13) {
            debugger;
                var inputScan = $(this).val();

                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    //ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
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
                if($("#selPLANT option:selected").val() == getWERKS){
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
        	}
        });
        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {

        var deli_no = $("#deliNoTitletxt").val();
        var qrCode = new qrManager.QRcode(inputScan);
        if(!qrManager.isValidBarcode(qrCode)){ // 바코드 Validation Check
            console.log("fail");
            return;
        }


        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/DELI_NO_LIST_3.do',
        	data: {
                'location':"B"
            	,'deliNo': deli_no
            	,'num5j': qrCode
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

    var map_arr;
	 // bc mode 변경시 이벤트
     $("#barcode_mode").on('change', function() {
        //auto_3rd_screen_call();
     });
	 // bc mode 변경시 이벤트
     $("#autoRefeshMode").on('change', function() {
        auto_timer();
     });
    var auto_timer = function(){
        //debugger;
            //3번째 화면 자동으로 호출
            //auto_mode = $("#autoRefeshMode option:selected").val();
            if(auto_mode == "auto"){
                //3번째 화면 자동으로 호출
                screen3rd_callTimer = setTimeout(auto_3rd_screen_call, typeof Number(refresh_time) * 1000);
                // 화면 리프레시 OFF
                clearTimeout(refresh_Timer);
            }else if(auto_mode == "NonAuto"){
                //3번째 화면 자동 호출 OFF
                clearTimeout(screen3rd_callTimer);
                get_refresh_time();
                // 화면 리프레시 OFF
                //refresh_Timer = setTimeout(deli_list_select(deli_no),typeof Number(refresh_time) * 1000);
                setListRowEvent();
            }else if(auto_mode == "allComplete"){
                deli_list_select_allComplete(deli_no);
                // 240226 작업시작
                /* Custom_Dialog("INFO","All Pallet Complete! \n This Screen closes in a few Seconds",48,9000);
                setTimeout(function(){
                    screenManager.moveToPage("SEAT_001.html", {
                        action: 'CLEAR_TOP'
                    });
                }, refresh_time * 1000);*/
            }
    }

     var auto_3rd_screen_call = function(){
//         bcMode = $("#barcode_mode option:selected").val();
//
//         // out_div 자동으로 선택되서 넘어가야함
//
//         deli_list_select(deli_no);
//         // 조회되기 전에 아래 함수가 호출됨
//         bc_mode_chk(map_arr, bcMode);
         //auto mode 전용 조회
         deli_list_select_auto(deli_no);
     }

     //bbcc bcbc 모드 체크로직 => 3번 화면 호출
     // - 정렬하기 전에 조회한번하고 소팅해야함
     var select_3rd_screen;
     var bc_mode_chk = function(map_arr, bcMode){
              debugger;
              if(bcMode == "BBCC"){
                 /*map_arr.sort((a, b) => {
                                      return a[1] < b[1] ? -1 : a[0] < b[0] ? 0 : 1;
                              });*/
                 // 정렬: 1. BH - CH  / 2. pallet_pos 역순
                 map_arr.sort((a, b) => a[1].localeCompare(b[1]) || b[0].localeCompare(a[0]));

              }else if (bcMode == "BCBC"){
                 // 정렬 그대로
              }
              //out div 1,2 중에 가장 빠른 값 리턴

              select_3rd_screen = -1;
              for(var i =0; i < map_arr.length; i++){
                    if(map_arr[i][3] != '2' && map_arr[i][3] != '3'){
                        select_3rd_screen = i;
                        break;
                    }
              }
              //모두 완료 됐을때, 화면 안넘김

                if(select_3rd_screen > -1){
                    screenManager.moveToPage("SEAT_003.html", {
                                        param: {
                                            DELI_NO: M.sec.encrypt(deli_no).result,
                                            NUM_5J: M.sec.encrypt(map_arr[select_3rd_screen][2]).result,
                                            PALLET_TYPE: M.sec.encrypt(map_arr[select_3rd_screen][1]).result,
                                            PALLET_POS: M.sec.encrypt(map_arr[select_3rd_screen][0].toString()).result
                                        }
                                    });
                }

     }
    // deli_no 조회
    var deli_list_select = function(deli_no){

        deli_no = dataManager.param("DELI_NO");

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/DELI_NO_LIST_2.do',
            data: {
                'location':"B"
                ,'deliNo': deli_no
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000129']").text(), {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                    //$("#inputScan").focus();
                    return;
                }

                var tag = "";
                var template = $("#ListTemplate").html();
                map_arr = [];
                //map_arr = receivedData.ListData;
                $.each(receivedData.ListData, function(index,rowData){
                    //bc 모드 map 생성
                    map_arr.push([rowData.PALLET_POS.toString(),rowData.BH_PALLET_TYPE,rowData.BH_NUM_5J,rowData.BH_OUT_DIV,rowData.BH_SCAN_YN]);
                    map_arr.push([rowData.PALLET_POS.toString(),rowData.CH_PALLET_TYPE,rowData.CH_NUM_5J,rowData.CH_OUT_DIV,rowData.CH_SCAN_YN]);


                        if(index % 2 ==0){
                            tag += "<div id =\"list_SEAT_002_div\">";
                        }
                        // 변경
                        tag += template.replace(/\{\{PALLET_POS\}\}/gi, rowData.PALLET_POS)
                                       .replace(/\{\{BH_PALLET_TYPE\}\}/gi, rowData.BH_PALLET_TYPE)
                                       .replace(/\{\{BH_NUM_5J\}\}/gi, rowData.BH_NUM_5J)
                                       .replace(/\{\{BH_OUT_DIV\}\}/gi, rowData.BH_OUT_DIV)
                                       .replace(/\{\{BH_SCAN_YN\}\}/gi, rowData.BH_SCAN_YN)
                                       .replace(/\{\{CH_PALLET_TYPE\}\}/gi, rowData.CH_PALLET_TYPE)
                                       .replace(/\{\{CH_NUM_5J\}\}/gi, rowData.CH_NUM_5J)
                                       .replace(/\{\{CH_OUT_DIV\}\}/gi, rowData.CH_OUT_DIV)
                                       .replace(/\{\{CH_SCAN_YN\}\}/gi, rowData.CH_SCAN_YN)
                                       .replace(/\{\{MLINK\}\}/gi, "mLink"
                                       );

                        if(index % 2 == 1 || receivedData.ListCount -1 == index){
                            tag += "</div>";
                        }

                                        });


                //$("#txtORDR_NO").text(deli_bar_no);
                $("#list_SEAT_002").html("");
                $("#list_SEAT_002_head").removeClass("blind");
                $("#list_SEAT_002").append(tag);
                setListRowEvent();

                $("#inputScan").focus();
            }
        });
    }
    // 2. AUTO_MODE deli_no 조회 후 -> 다음 화면 결정하기 위해서 만듬
    var deli_list_select_auto = function(deli_no){

            deli_no = dataManager.param("DELI_NO");

            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/DELI_NO_LIST_2.do',
                data: {
                    'location':"B"
                    ,'deliNo': deli_no
                },
                success: function(receivedData, setting) {
                    var rowData = receivedData.ListData[0];

                    if(receivedData.ListCount == 0){
                        popupManager.instance("Error List Count 0", {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                        //$("#inputScan").focus();
                        return;
                    }

                    var tag = "";
                    var template = $("#ListTemplate").html();
                    map_arr = [];
                    //map_arr = receivedData.ListData;
                    $.each(receivedData.ListData, function(index,rowData){
                        //bc 모드 map 생성
                        map_arr.push([rowData.PALLET_POS.toString(),rowData.BH_PALLET_TYPE,rowData.BH_NUM_5J,rowData.BH_OUT_DIV,rowData.BH_SCAN_YN]);
                        map_arr.push([rowData.PALLET_POS.toString(),rowData.CH_PALLET_TYPE,rowData.CH_NUM_5J,rowData.CH_OUT_DIV,rowData.CH_SCAN_YN]);


                            if(index % 2 ==0){
                                tag += "<div id =\"list_SEAT_002_div\">";
                            }
                            // 변경
                            tag += template.replace(/\{\{PALLET_POS\}\}/gi, rowData.PALLET_POS)
                                           .replace(/\{\{BH_PALLET_TYPE\}\}/gi, rowData.BH_PALLET_TYPE)
                                           .replace(/\{\{BH_NUM_5J\}\}/gi, rowData.BH_NUM_5J)
                                           .replace(/\{\{BH_OUT_DIV\}\}/gi, rowData.BH_OUT_DIV)
                                           .replace(/\{\{BH_SCAN_YN\}\}/gi, rowData.BH_SCAN_YN)
                                           .replace(/\{\{CH_PALLET_TYPE\}\}/gi, rowData.CH_PALLET_TYPE)
                                           .replace(/\{\{CH_NUM_5J\}\}/gi, rowData.CH_NUM_5J)
                                           .replace(/\{\{CH_OUT_DIV\}\}/gi, rowData.CH_OUT_DIV)
                                           .replace(/\{\{CH_SCAN_YN\}\}/gi, rowData.CH_SCAN_YN)
                                           .replace(/\{\{MLINK\}\}/gi, "mLink"
                                           );

                            if(index % 2 == 1 || receivedData.ListCount -1 == index){
                                tag += "</div>";
                            }

                                            });


                    //$("#txtORDR_NO").text(deli_bar_no);
                    $("#list_SEAT_002").html("");
                    $("#list_SEAT_002_head").removeClass("blind");
                    $("#list_SEAT_002").append(tag);
                    setListRowEvent();

                    $("#inputScan").focus();
                    // Auto mode
                    bcMode_change = getPreferences("pda_sorting_Mode","bcMode","BCBC");
                    //bcMode = $("#barcode_mode option:selected").val();
                    bc_mode_chk(map_arr, bcMode_change);
                }
            });
        }
    // 3. all complete 조회 후 -> 팝업
    var deli_list_select_allComplete = function(deli_no){

            deli_no = dataManager.param("DELI_NO");

            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/DELI_NO_LIST_2.do',
                data: {
                    'location':"B"
                    ,'deliNo': deli_no
                },
                success: function(receivedData, setting) {
                    var rowData = receivedData.ListData[0];

                    if(receivedData.ListCount == 0){
                        popupManager.instance("Error List Count 0", {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                        //$("#inputScan").focus();
                        return;
                    }

                    var tag = "";
                    var template = $("#ListTemplate").html();
                    map_arr = [];
                    //map_arr = receivedData.ListData;
                    $.each(receivedData.ListData, function(index,rowData){
                        //bc 모드 map 생성
                        map_arr.push([rowData.PALLET_POS.toString(),rowData.BH_PALLET_TYPE,rowData.BH_NUM_5J,rowData.BH_OUT_DIV,rowData.BH_SCAN_YN]);
                        map_arr.push([rowData.PALLET_POS.toString(),rowData.CH_PALLET_TYPE,rowData.CH_NUM_5J,rowData.CH_OUT_DIV,rowData.CH_SCAN_YN]);


                            if(index % 2 ==0){
                                tag += "<div id =\"list_SEAT_002_div\">";
                            }
                            // 변경
                            tag += template.replace(/\{\{PALLET_POS\}\}/gi, rowData.PALLET_POS)
                                           .replace(/\{\{BH_PALLET_TYPE\}\}/gi, rowData.BH_PALLET_TYPE)
                                           .replace(/\{\{BH_NUM_5J\}\}/gi, rowData.BH_NUM_5J)
                                           .replace(/\{\{BH_OUT_DIV\}\}/gi, rowData.BH_OUT_DIV)
                                           .replace(/\{\{BH_SCAN_YN\}\}/gi, rowData.BH_SCAN_YN)
                                           .replace(/\{\{CH_PALLET_TYPE\}\}/gi, rowData.CH_PALLET_TYPE)
                                           .replace(/\{\{CH_NUM_5J\}\}/gi, rowData.CH_NUM_5J)
                                           .replace(/\{\{CH_OUT_DIV\}\}/gi, rowData.CH_OUT_DIV)
                                           .replace(/\{\{CH_SCAN_YN\}\}/gi, rowData.CH_SCAN_YN)
                                           .replace(/\{\{MLINK\}\}/gi, "mLink"
                                           );

                            if(index % 2 == 1 || receivedData.ListCount -1 == index){
                                tag += "</div>";
                            }

                                            });


                    //$("#txtORDR_NO").text(deli_bar_no);
                    $("#list_SEAT_002").html("");
                    $("#list_SEAT_002_head").removeClass("blind");
                    $("#list_SEAT_002").append(tag);
                    setListRowEvent();

                    Custom_Dialog("INFO","All Pallet Complete! \n This Screen closes in a few Seconds",48,(refresh_time * 1000) - 200);
                    setTimeout(function(){
                        screenManager.moveToPage("SEAT_001.html", {
                            action: 'CLEAR_TOP'
                        });
                    }, refresh_time * 1000);

                }
            });
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

    // refresh 주기 조회
    var get_refresh_time = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/COMM_CD_CALL.do',
            data: {
                'CODE':"REFRESH"
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                if(receivedData.ListCount == 0){
                        popupManager.instance("Refresh Time null", {showtime:"LONG"});

                        //기본 5초
                        refresh_time =5;
                        return;
                }
                $.each(receivedData.ListData, function(index,rowData){
                    refresh_time = Number(rowData.CD_DESC1);
                });
                refresh_Timer = setInterval( function(){
                    deli_list_select(deli_no);
                }
                , Number(refresh_time)* 1000);
                },
            error: function(errorCode, errorMessage, setting) {
                popupManager.instance("Refresh Time null", {showtime:"LONG"});
                refresh_Timer = setInterval(function(){
                    deli_list_select(deli_no);
                }
                , 5000);
            }
        });
    }

	// 자식창에 갔다가 돌아왔을때 리로드용

	var setReloadEvent = function() {

	    // 3번째 화면에서 작업이 끝나면, auto 모드로 전환
	    complete_3rd = dataManager.param("Complete");
	    if(complete_3rd == "OK"){
	        auto_mode = "auto";
	    }else if(complete_3rd == "NG"){
	        auto_mode = "NonAuto";
	    }
	    // 모든 팔레뜨 저장되었을때, 5초 후 1번화면으로 넘어감
	    else if(complete_3rd == "ALL_OK"){
	        auto_mode = "allComplete";
	    }
	    //TEST
	    //auto_mode = "auto";
	    if(reloadFlag){
	        // 화면 초기화 후 리로딩
            blockMultiTap = false;
            reloadFlag = false;

	    }
	    //화면 초기화
	    setInitEvent();
	};
	var setOnHideEvent = function(){
        //3번째 화면 자동 호출 OFF
        clearTimeout(screen3rd_callTimer);
        // 화면 리프레시 OFF
        clearTimeout(refresh_Timer);

	}

	// 리스트에 클릭 이벤트 등록
    var setListRowEvent = function(){
        $(".mLink").off("click","**");
        if(auto_mode == "auto"){

        }else if(auto_mode == "NonAuto"){
            $(".mLink").on("click", function(){
                if(!blockMultiTap){ // 중복 리스트 클릭 방지
                    blockMultiTap = true;
                    reloadFlag = true;

                    screenManager.moveToPage("SEAT_003.html", {
                        param: {
                            DELI_NO: M.sec.encrypt(deli_no).result,
                            NUM_5J: M.sec.encrypt($(this).find(".NUM_5J_002").text()).result,
                            PALLET_TYPE: M.sec.encrypt($(this).find(".PALLET_TYPE").text()).result,
                            PALLET_POS: M.sec.encrypt($(this).find(".PALLET_POS").text()).result,
                            SCAN_YN: M.sec.encrypt($(this).find(".SCAN_YN").text()).result
                        }
                    });
                }
            });
        }

    };

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
		screenManager.moveToBack();
	};
    $("#btn_back").on("click", function(){
		screenManager.moveToBack();
	});

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent,
	    setOnHideEvent: setOnHideEvent
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
	page.setOnHideEvent();
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});