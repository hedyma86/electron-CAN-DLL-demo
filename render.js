/*
hedyMa created by 2021/01/26
CANalyst communication
*/

const path = require('path');
const fs = require('fs');
const os =require('os');
const ffi = require('ffi-napi');
const ref = require('ref-napi')
const refArray  = require('ref-array-napi')
const StructType = require('ref-struct-napi');
const {ipcRenderer } = require('electron');


// define the "type" instance according to the spec 

let uint16 = ref.types.uint16;
let uint8 = ref.types.uint8;
let byte = ref.types.byte;
let uchar = ref.types.uchar;
let ushort = ref.types.ushort;
let DWORD = ref.types.ulong;
let byte8Array = refArray('byte',8);
//let char

//创建结构体，初始化CAN盒使用 
const MyInitCANStruct = StructType({
    AccCode:DWORD,
    AccMask:DWORD,
    Reserved:DWORD,
    Filter:uchar,
    Timing0:uchar,
    Timing1:uchar,
    Mode:uchar
});
//发送数据结构体
const MyCANDataStruct = StructType({
    ID:ref.types.uint,
    TimeStamp:ref.types.uint,
    TimeFlag:byte,
    SendType:byte,
    RemoteFlag:byte,
    ExternFlag:byte,
    DataLen:byte,
    Data:byte8Array,
    Reserved:refArray('byte',3)
});
//查询设备信息结构体
const VCI_BOARD_INFO = StructType({
    hw_Version:ushort,
    fw_Version:ushort,
    dr_Version:ushort,
    in_Version:ushort,
    irq_Num:ushort,
    can_Num:byte,
    str_Serial_Num:byte8Array,
    str_hw_Type:refArray('byte',3),
    Reserved:ushort
});
let structArrayType = refArray(MyCANDataStruct); //结构体数组类型
let structArrayType2 = refArray(MyCANDataStruct);

let libpath = path.join(__dirname, '/native/ControlCAN.dll');
let testLib = ffi.Library(libpath, {
    'VCI_OpenDevice': ['UInt32', ['UInt32','UInt32','UInt32']],
    'VCI_InitCAN': ['UInt32', ['UInt32','UInt32','UInt32',ref.refType(MyInitCANStruct)]],
    'VCI_ReadBoardInfo': ['UInt32', ['UInt32','UInt32',ref.refType(VCI_BOARD_INFO)]],
    'VCI_StartCAN': ['UInt32', ['UInt32','UInt32','UInt32']],
    'VCI_Transmit': ['UInt32', ['UInt32','UInt32','UInt32',ref.refType(MyCANDataStruct),'UInt32']],
    'VCI_Receive': ['UInt32', ['UInt32','UInt32','UInt32',ref.refType(MyCANDataStruct),'UInt32','int32']],
    'VCI_CloseDevice': ['UInt32', ['UInt32','UInt32']]
});

// 选择创芯can卡
const m_devtype = 4;
// 索引号
const m_devind = 0;
//通道
let m_canind = 0;

let m_bOpen=0;
//打开设备 参数 为波特率index [125k,250k,500k,1000k] 和 通道index
function connect(canBaudRate,passageway) {
    //设置通道
    m_canind = passageway;
    //初始化 125k 250k 500k 1000k 分别对应的Timing0 和Timing1的值
    let Timing0=[0x03,0x01,0x00,0x00];
    let Timing1=[0x1C,0x1C,0x1C,0x14];

    const config2 = new MyInitCANStruct({
        AccCode:0,
        AccMask:0xffffffff,
        Timing0:Timing0[canBaudRate],
        Timing1:Timing1[canBaudRate],
        Filter:1,
        Mode:0,  //模式  0正常工作 1仅监听模式 2自发自收测试模式
        Reserved:0
    });

    if (m_bOpen==1){
        testLib.VCI_CloseDevice(m_devtype, m_devind);
        m_bOpen = 0;
    }

    if( testLib.VCI_OpenDevice(m_devtype, m_devind, 0) ==0 ){
        return false;
    }else{
        let a = testLib.VCI_InitCAN(m_devtype, m_devind, m_canind, config2.ref()); // true
        showMsg('初始化设备' + a);
        m_bOpen = 1;
        //开启设备
        let mStartCan = testLib.VCI_StartCAN(m_devtype, m_devind, m_canind);
        showMsg('开启设备'+mStartCan);
        return true;
    }

}

//获取设备信息 
function getInfo() {
    const pInfo = new VCI_BOARD_INFO();
    let info = testLib.VCI_ReadBoardInfo(m_devtype, m_devind,pInfo.ref());
    if(info==1){
        showMsg('返回1，获取信息成功');
    }else{
        showMsg('获取信息失败,返回值'+info);
    }
    console.log(info);
    console.log(pInfo);
}

//发送数据 
function sendData(arrData) {
    //创建结构体数组
    let dataArray2 = new structArrayType2(1);
    const _d =  new byte8Array(8);
    _d[0] = 0;
    _d[1] = 0;
    _d[2] = 0;
    _d[3] = 0;
    _d[4] = 0;
    _d[5] = 0;
    _d[6] = 0;
    _d[7] = 0;
    arrData.forEach((v,i)=>{
        //input中的value默认为字符串，改为number类型
        _d[i] = Number(v);
    });
    dataArray2[0].ID = 0x0CDA00F1;
    dataArray2[0].Data = _d;
    dataArray2[0].DataLen = 8;
    dataArray2[0].ExternFlag = 1;
    //console.warn('发送数据');
    //console.warn(dataArray2[0]);
    testLib.VCI_Transmit(m_devtype, m_devind, m_canind,dataArray2[0].ref(),1);

}

//接收数据 每500ms发送一次 
let timer = null;
let isWorking = false;
function receiveData(callback) {
    clearTimeout(timer);
    let dataArray = new structArrayType(1000);
    let res = testLib.VCI_Receive(m_devtype, m_devind, m_canind,dataArray[0].ref(), 1000, 100);
    if(res>0 && callback && typeof callback == 'function'){
        callback(dataArray);
    }
    if(isWorking){
        timer = setTimeout(function (args) {receiveData(callback)},500);
    }
}

//关闭设备 
function close() {
    let result = testLib.VCI_CloseDevice(m_devtype, m_devind);
    if(result==1){
        showMsg('返回1，关闭设备成功');
    }else{
        showMsg('关闭设备失败,返回值'+result);
    }
}


let BDStructType = {
    Size:uint16,
    VERSION_MAJOR:byte,
    VERSION_MINOR:byte,
    YEAR:uint16,
    TIME:refArray('uint8',5),
    PN:refArray('uint8',11),

    PRODCODE:refArray('uint8',18),
    FLAG:uint8,
    UID:uint8,
    SOFTID:refArray('uint8',30),
};
//定义标定结构体
const BD_PARA_MSG_TYPE = StructType(BDStructType);
let myStruct = new BD_PARA_MSG_TYPE();

function getStructByArray(arr) {
    //解决大小端问题 硬件标定为大端模式
    ref.endianness = 'BE';

    //获得结构体的buffer实例 （也等于指针/地址）
    let structRef = myStruct.ref();
    const buf = Buffer.from(arr);
    buf.copy(structRef);
    let obj = JSON.parse(JSON.stringify(myStruct));

    //恢复PC小端模式
    ref.endianness = 'LE';
    return obj;
}
function getStructByJSON(o,sourceStruct) {
    showMsg(JSON.stringify(o));
    showMsg(JSON.stringify(sourceStruct));
    ref.endianness = 'BE';
    Object.keys(BDStructType).forEach(key=>{
        myStruct[key]=o[key] || sourceStruct[key];
        showMsg(key+':'+myStruct[key]+'======='+o[key]+'=='+sourceStruct[key]);
    });
    ref.endianness = 'LE';
    return myStruct;
}
//显示消息
function showMsg(msg){
    console.log(msg);
    let str;
    //console.log(typeof msg);
    switch(typeof msg){
        case 'string':
            str = '<div>'+msg+'</div>';
            break;
        case 'object':
            str = '<div>'+msg+'</div>';
            break;
        default:
            str = '<div>'+msg+'</div>';

    }
    let dom = document.getElementById('msg')
    dom.innerHTML+=str;
}


document.getElementById('connect').onclick = connect;
document.getElementById('sendData').onclick = function(){
    let arrData = document.getElementById('inp').value.split(',');
    console.log(arrData);
    sendData(arrData);
};
document.getElementById('getInfo').onclick = getInfo;
document.getElementById('close').onclick = close;

//关闭版权窗口
if(document.getElementById('closeWin')){
    document.getElementById('closeWin').onclick = function () {
        ipcRenderer.send('closeWindow','subWindow');
    }
}
