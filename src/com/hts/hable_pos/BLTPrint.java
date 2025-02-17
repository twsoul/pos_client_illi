package com.hts.hable_pos;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;
import android.support.v4.app.ActivityCompat;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import m.client.android.library.core.common.DataHandler;
import m.client.android.library.core.common.Parameters;
import m.client.android.library.core.model.NetReqOptions;
import m.client.android.library.core.view.AbstractActivity;

public class BLTPrint extends AbstractActivity {

    String TAG = "BLTPrint";
    UUID BT_MODULE_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB"); // "random" unique identifier

    TextView textStatus;
    Button btnParied, btnSend;
    ListView listView;

    BluetoothAdapter btAdapter;
    Set<BluetoothDevice> pairedDevices;
    ArrayAdapter<String> btArrayAdapter;
    ArrayList<String> deviceAddressArray;

    private final static int REQUEST_ENABLE_BT = 1;
    BluetoothSocket btSocket = null;

    ConnectedThread connectedThread;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTheme(android.R.style.Theme_Light_NoTitleBar);
        setContentView(R.layout.activity_blt);

        // Get permission
        String[] permission_list = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
        };
        ActivityCompat.requestPermissions(BLTPrint.this, permission_list, 1);

        // Enable bluetooth
        btAdapter = BluetoothAdapter.getDefaultAdapter();
        if (!btAdapter.isEnabled()) {
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
        }

        // variables
        textStatus = (TextView) findViewById(R.id.text_status);
        btnParied = (Button) findViewById(R.id.btn_paired);
        btnSend = (Button) findViewById(R.id.btn_send);
        listView = (ListView) findViewById(R.id.listview);

        // Show paired devices
        btArrayAdapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1);
        deviceAddressArray = new ArrayList<>();
        listView.setAdapter(btArrayAdapter);

        listView.setOnItemClickListener(new myOnItemClickListener());
    }

    public static boolean getType(String word) {
        return Pattern.matches(".*[ㄱ-ㅎㅏ-ㅣ가-힣]+.*", word);
    }

    public void onClickButtonPaired(View view){
        btArrayAdapter.clear();
        if(deviceAddressArray!=null && !deviceAddressArray.isEmpty()){ deviceAddressArray.clear(); }
        pairedDevices = btAdapter.getBondedDevices();
        if (pairedDevices.size() > 0) {
            // There are paired devices. Get the name and address of each paired device.
            for (BluetoothDevice device : pairedDevices) {
                String deviceName = device.getName();
                String deviceHardwareAddress = device.getAddress(); // MAC address
                btArrayAdapter.add(deviceName);
                deviceAddressArray.add(deviceHardwareAddress);
            }
        }
    }

    // Send string "a"
    public void onClickButtonSend(View view){
        Intent intent = getIntent();
        String PLANT = intent.getStringExtra("PLANT");
        String PRINT_DATE = intent.getStringExtra("PRINT_DATE");
        String BOX_NO = intent.getStringExtra("BOX_NO");
        String PART_NO = intent.getStringExtra("PART_NO");
        String PART_NM = intent.getStringExtra("PART_NM");
        String LOT_NO = intent.getStringExtra("LOT_NO");
        String EO_NO = intent.getStringExtra("EO_NO");
        String QTY = intent.getStringExtra("QTY");
        String MODIFY_QTY = intent.getStringExtra("MODIFY_QTY");
        String DELIVERY_DATE = intent.getStringExtra("DELIVERY_DATE");
        String SUPPLIER_NO = intent.getStringExtra("SUPPLIER_NO");
        String INSP_YN = intent.getStringExtra("INSP_YN");
        String SUPPLIER = intent.getStringExtra("SUPPLIER");
        String LOC = intent.getStringExtra("LOC");
        String WEIGHT = intent.getStringExtra("WEIGHT");
        String TOTAL_WEIGHT = intent.getStringExtra("TOTAL_WEIGHT");
        String MEMO = intent.getStringExtra("MEMO");
        String BARCODE = intent.getStringExtra("BARCODE");
        String NewLine = "\r\n";
        String mmm = null;
        boolean bRet = false;

        // x축 y축 총괄 이동
        int x = 0;
        int y = 0;
        // 높이 설정
        int h = 0;
        // 바코드 크기설정
        int qrcode = 4;

        // 폰트 확인용 ZPL
        //mmm += "^XA^WDE:*.TTF^XZ";

        mmm += "^XA";
        mmm += "^FO"+ String.valueOf(30+x) +","+String.valueOf(25+y)+"^GB770,450,2^FS"; // 전체 네모 크기
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(70+y)+"^GB770,0,2^FS"; // 가로 1번줄
        mmm += "^FO"+String.valueOf(160+x)+","+String.valueOf(70+y)+"^GB0,405,2^FS"; // 세로 1번줄
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(120+y)+"^GB770,0,2^FS"; // 가로 2번줄
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(170+y)+"^GB770,0,2^FS"; // 가로 3번줄
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(220+y)+"^GB770,0,2^FS"; // 가로 4번줄
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(270+y)+"^GB770,0,2^FS"; // 가로 5번줄
        mmm += "^FO"+String.valueOf(380+x)+","+String.valueOf(70+y)+"^GB0,150,2^FS"; // 세로 2-1번줄
        mmm += "^FO"+String.valueOf(540+x)+","+String.valueOf(70+y)+"^GB0,150,2^FS"; // 세로 3-1번줄
        mmm += "^FO"+String.valueOf(650+x)+","+String.valueOf(120+y)+"^GB0,50,2^FS"; // 세로 4-1번줄
        mmm += "^FO"+String.valueOf(750+x)+","+String.valueOf(120+y)+"^GB0,50,2^FS"; // 세로 5번줄
        mmm += "^FO"+String.valueOf(380+x)+","+String.valueOf(270+y)+"^GB0,205,2^FS"; // 세로 2-2번줄
        mmm += "^FO"+String.valueOf(540+x)+","+String.valueOf(270+y)+"^GB0,205,2^FS"; // 세로 3-2번줄
        mmm += "^FO"+String.valueOf(670+x)+","+String.valueOf(270+y)+"^GB0,150,2^FS"; // 세로 4-2번줄
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(320+y)+"^GB350,0,2^FS"; // 가로 6-1번줄
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(370+y)+"^GB350,0,2^FS"; // 가로 7-1번줄
        mmm += "^FO"+String.valueOf(30+x)+","+String.valueOf(420+y)+"^GB770,0,2^FS"; // 가로 8번줄
        mmm += "^FO"+String.valueOf(540+x)+","+String.valueOf(320+y)+"^GB260,0,2^FS"; // 가로 6-2번줄
        mmm += "^FO"+String.valueOf(540+x)+","+String.valueOf(370+y)+"^GB260,0,2^FS"; // 가로 7-2번줄
        mmm += "^FT"+String.valueOf(402+x)+","+String.valueOf(415+y)+"^BQN,2,"+qrcode+"";
        mmm += "^FH^FDLA,"+BARCODE+"^FS";
        mmm += "^BQN,2,2";
        mmm += "^FT"+String.valueOf(20+x)+","+String.valueOf(55+y)+"^A0N,24,30^FB300,1,0,C^FH^FD"+PLANT+"\\&^FS";
        mmm += "^FT"+String.valueOf(640+x)+","+String.valueOf(55+y)+"^A0N,25,25^FB150,1,0,C^FH^FDPicking Ticket\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(105+y)+"^A0N,25,25^FB150,1,0,C^FH^FDPrint Date\\&^FS";
        mmm += "^FT"+String.valueOf(75+x)+","+String.valueOf(105+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+PRINT_DATE+"\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(155+y)+"^A0N,25,25^FB150,1,0,C^FH^FDBox No.\\&^FS";
        mmm += "^FT"+String.valueOf(75+x)+","+String.valueOf(155+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+BOX_NO+"\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(205+y)+"^A0N,25,25^FB150,1,0,C^FH^FDPart No.\\&^FS";
        mmm += "^FT"+String.valueOf(75+x)+","+String.valueOf(210+y)+"^A0N,34,30^FB400,1,0,C^FH^FD"+PART_NO+"\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(255+y)+"^A0N,25,25^FB150,1,0,C^FH^FDPart Name\\&^FS";
        mmm += "^FT"+String.valueOf(180+x)+","+String.valueOf(255+y)+"^A0N,25,25^FB600,1,0,C^FH^FD"+PART_NM+"\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(305+y)+"^A0N,25,25^FB150,1,0,C^FH^FDLot No.\\&^FS";
        mmm += "^FT"+String.valueOf(75+x)+","+String.valueOf(305+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+LOT_NO+"\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(355+y)+"^A0N,25,25^FB150,1,0,C^FH^FDEo No.\\&^FS";
        mmm += "^FT"+String.valueOf(75+x)+","+String.valueOf(355+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+EO_NO+"\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(405+y)+"^A0N,25,25^FB150,1,0,C^FH^FDQty.\\&^FS";
        mmm += "^FT"+String.valueOf(85+x)+","+String.valueOf(417+y)+"^A0N,55,50^FB400,1,0,C^FH^FD"+QTY+"\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(445+y)+"^A0N,23,22^FB150,1,0,C^FH^FDModify Qty.\\&^FS";
        mmm += "^FT"+String.valueOf(25+x)+","+String.valueOf(465+y)+"^A0N,23,22^FB150,1,0,C^FH^FD(Manual)\\&^FS";
        mmm += "^FT"+String.valueOf(75+x)+","+String.valueOf(455+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+MODIFY_QTY+"\\&^FS";
        mmm += "^FT"+String.valueOf(390+x)+","+String.valueOf(105+y)+"^A0N,25,25^FB150,1,0,C^FH^FDDelivery Date\\&^FS";
        mmm += "^FT"+String.valueOf(470+x)+","+String.valueOf(105+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+DELIVERY_DATE+"\\&^FS";
        mmm += "^FT"+String.valueOf(390+x)+","+String.valueOf(155+y)+"^A0N,25,25^FB150,1,0,C^FH^FDSupplier No.\\&^FS";
        mmm += "^FT"+String.valueOf(400+x)+","+String.valueOf(155+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+SUPPLIER_NO+"\\&^FS";
        mmm += "^FT"+String.valueOf(500+x)+","+String.valueOf(155+y)+"^A0N,25,25^FB400,1,0,C^FH^FDInsp Y/N\\&^FS";
        mmm += "^FT"+String.valueOf(575+x)+","+String.valueOf(155+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+INSP_YN+"\\&^FS";
        mmm += "^FT"+String.valueOf(390+x)+","+String.valueOf(205+y)+"^A0N,25,25^FB150,1,0,C^FH^FDSupplier\\&^FS";
        mmm += "^FT"+String.valueOf(450+x)+","+String.valueOf(205+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+SUPPLIER+"\\&^FS";
        mmm += "^FT"+String.valueOf(410+x)+","+String.valueOf(305+y)+"^A0N,25,25^FB400,1,0,C^FH^FDLoc.\\&^FS";
        mmm += "^FT"+String.valueOf(540+x)+","+String.valueOf(305+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+LOC+"\\&^FS";
        mmm += "^FT"+String.valueOf(410+x)+","+String.valueOf(345+y)+"^A0N,23,22^FB400,1,0,C^FH^FDWeight\\&^FS";
        mmm += "^FT"+String.valueOf(410+x)+","+String.valueOf(365+y)+"^A0N,23,22^FB400,1,0,C^FH^FD(KG/EA)\\&^FS";
        mmm += "^FT"+String.valueOf(540+x)+","+String.valueOf(355+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+WEIGHT+"\\&^FS";
        mmm += "^FT"+String.valueOf(410+x)+","+String.valueOf(395+y)+"^A0N,23,22^FB400,1,0,C^FH^FDTotal Weight\\&^FS";
        mmm += "^FT"+String.valueOf(410+x)+","+String.valueOf(415+y)+"^A0N,23,22^FB400,1,0,C^FH^FD(KG/BOX)\\&^FS";
        mmm += "^FT"+String.valueOf(540+x)+","+String.valueOf(405+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+TOTAL_WEIGHT+"\\&^FS";
        mmm += "^FT"+String.valueOf(390+x)+","+String.valueOf(455+y)+"^A0N,25,25^FB150,1,0,C^FH^FDMEMO\\&^FS";
        mmm += "^FT"+String.valueOf(470+x)+","+String.valueOf(455+y)+"^A0N,25,25^FB400,1,0,C^FH^FD"+MEMO+"\\&^FS";
        mmm += "^PQ2^XZ";

        if(connectedThread!=null){
            try{
                setStatus("Sending Data", Color.BLUE);
                connectedThread.write(mmm);
            }catch (Exception e){
                setStatus(e.getMessage(), Color.RED);
            }
            finally {
                close();
            }
        }
    }

    public void back(){
        Log.wtf("finish","finish");
        finish();
    }

    public void close(){
        try{
            setStatus("Disconnecting", Color.RED);
            if (btSocket != null) {
                btSocket.close();
            }
            setStatus("Not Connected", Color.RED);
        }catch (IOException e){
            setStatus("COMM Error! Disconnected", Color.RED);
        }finally {
            back();
        }
    }

    @Override
    protected void onDestroy() {
        Log.wtf("onDestroy","onDestroy");

        close();

        super.onDestroy();

        // Don't forget to unregister the ACTION_FOUND receiver.
        // unregisterReceiver(receiver);
    }

    @Override
    public void onRestoreActivity(Parameters parameters) {

    }

    @Override
    public void onFinishedCaptureView() {
        Log.wtf("onFinishedCaptureView","onFinishedCaptureView");
    }

    @Override
    public void onApplicationWillTerminate() {

    }

    @Override
    public void requestData(String s, String s1, DataHandler dataHandler, NetReqOptions netReqOptions) {

    }

    @Override
    public void responseData(int i, String s, String s1, String s2, NetReqOptions netReqOptions) {

    }

    @Override
    public void handlingError(String s, String s1, String s2, String s3, NetReqOptions netReqOptions) {

    }

    public class myOnItemClickListener implements AdapterView.OnItemClickListener {

        @Override
        public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
            setStatus("Connecting...", Color.YELLOW);

            if(btSocket != null){
                close();
            }
            Toast.makeText(getApplicationContext(), btArrayAdapter.getItem(position), Toast.LENGTH_SHORT).show();

            final String name = btArrayAdapter.getItem(position); // get name
            final String address = deviceAddressArray.get(position); // get address

            boolean flag = true;

            BluetoothDevice device = btAdapter.getRemoteDevice(address);

            // create & connect socket
            try {
                btSocket = createBluetoothSocket(device);
                btSocket.connect();
                setStatus("Connected to "+ name, Color.GREEN);
            } catch (IOException e) {
                flag = false;
                setStatus("Comm Error! Disconnecting", Color.RED);
                close();
            }

            // start bluetooth communication
            if(flag){
                connectedThread = new ConnectedThread(btSocket);
                connectedThread.start();
            }
        }
    }

    void setStatus(final String statusMessage, final int color) {
        runOnUiThread(new Runnable() {
            public void run() {
                textStatus.setBackgroundColor(color);
                textStatus.setText(statusMessage);
            }
        });
    }

    public void enableSendButton(final boolean enabled) {
        runOnUiThread(new Runnable() {
            public void run() {
                btnSend.setEnabled(enabled);
            }
        });
    }

    public void enableConnectButton(final boolean enabled) {
        runOnUiThread(new Runnable() {
            public void run() {
                btnParied.setEnabled(enabled);
            }
        });
    }

    private BluetoothSocket createBluetoothSocket(BluetoothDevice device) throws IOException {
        try {
            final Method m = device.getClass().getMethod("createInsecureRfcommSocketToServiceRecord", UUID.class);
            return (BluetoothSocket) m.invoke(device, BT_MODULE_UUID);
        } catch (Exception e) {
            Log.e(TAG, "Could not create Insecure RFComm Connection",e);
        }

        return  createBluetoothSocket(device);
    }
}