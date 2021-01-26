// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.


const path = require('path');

const ffi = require('ffi-napi');
const ref = require('ref-napi')
const refArray  = require('ref-array-napi')
const StructType = require('ref-struct-napi');

var UInt32 = ref.types.uint32;
var int32 = ref.types.int32;
var byte = ref.types.byte;
var char = ref.types.char;
var uchar = ref.types.uchar;
var ushort = ref.types.ushort;
var DWORD = ref.types.ulong;
var byte8Array = refArray('byte',8);
//var char

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
var structArrayType = refArray(MyCANDataStruct); //结构体数组类型
var structArrayType2 = refArray(MyCANDataStruct);

var libpath = path.join(__dirname, '/native/ControlCAN.dll');
var testLib = ffi.Library(libpath, {
    'VCI_OpenDevice': ['UInt32', ['UInt32','UInt32','UInt32']],
    'VCI_InitCAN': ['UInt32', ['UInt32','UInt32','UInt32',ref.refType(MyInitCANStruct)]],
    'VCI_ReadBoardInfo': ['UInt32', ['UInt32','UInt32',ref.refType(VCI_BOARD_INFO)]],
    'VCI_StartCAN': ['UInt32', ['UInt32','UInt32','UInt32']],
    'VCI_Transmit': ['UInt32', ['UInt32','UInt32','UInt32',ref.refType(MyCANDataStruct),'UInt32']],
    'VCI_Receive': ['UInt32', ['UInt32','UInt32','UInt32',ref.refType(MyCANDataStruct),'UInt32','int32']],
    'VCI_CloseDevice': ['UInt32', ['UInt32','UInt32']]
});

/*var libpath2 = path.join(__dirname, '/native/dllConvdrt.dll');
var testLib2 = ffi.Library(libpath2, {
    'add': ['int', ['int','int']]
});
var c = testLib2.add(1,2);
console.log(c);*/

/*var libpath2 = path.join(__dirname, '/native/myAddDll.dll');
var testLib2 = ffi.Library(libpath2, {
    'funAdd': ['int', ['int','int']]
});
var c = testLib2.funAdd(1,2);
console.log(c);*/

// 选择创芯can卡
const m_devtype = 4;
// 索引号
const m_devind = 0;
//通道
const m_canind = 0;

//初始化
const config2 = new MyInitCANStruct({
    AccCode:0,
    AccMask:0xffffffff,
    Timing0:0x01,
    Timing1:0x1C,
    Filter:1,
    Mode:0,  //模式  0正常工作 1仅监听模式 2自发自收测试模式
    Reserved:0
});

var m_bOpen=0;
function connect() {
    if (m_bOpen==1)
    {
        testLib.VCI_CloseDevice(m_devtype, m_devind);
        m_bOpen = 0;
    }else {

        if( testLib.VCI_OpenDevice(m_devtype, m_devind, 0) ==0 ){
            console.log('打开设备' + 失败);
        }else{
            let a = testLib.VCI_InitCAN(m_devtype, m_devind, m_canind, config2.ref()); // true
            console.log('初始化设备' + a);
            m_bOpen = 1;
        }
    }
}
//开启设备
function start() {
    let mStartCan = testLib.VCI_StartCAN(m_devtype, m_devind, m_canind);
    console.log('开启设备'+mStartCan);
}
//获取设备信息
function getInfo() {
    const pInfo = new VCI_BOARD_INFO();
    let info = testLib.VCI_ReadBoardInfo(m_devtype, m_devind,pInfo.ref());
    console.log('获取信息'+info);
    console.log(info);
    console.log(pInfo);
    console.log(pInfo.ref());
    //const   hw_Version  =  Buffer.from(pInfo.hw_Version);
    //console.log('硬件版本号:'+hw_Version);
}

document.getElementById('connect').onclick = connect;
document.getElementById('start').onclick = start;
document.getElementById('sendData').onclick = sendData;
document.getElementById('getInfo').onclick = getInfo;
document.getElementById('close').onclick = close;

//关闭
function close() {
    let a = testLib.VCI_CloseDevice(m_devtype, m_devind);
    console.log('关闭设备'+a);

}
//发送数据
function sendData() {
    var dataArray2 = new structArrayType2(1);
    const _d =  new byte8Array(8);
    _d[0] = 0;
    _d[1] = 0x4F;
    _d[2] = 0;
    _d[3] = 0;
    _d[4] = 0;
    _d[5] = 0;
    _d[6] = 0;
    _d[7] = 0;
    dataArray2[0].ID = 0x0CDA00F1;
    dataArray2[0].Data = _d;
    dataArray2[0].DataLen = 8;
    dataArray2[0].ExternFlag = 1;
    testLib.VCI_Transmit(m_devtype, m_devind, m_canind,dataArray2[0].ref(),1);
}
//接收数据
var dataArray = new structArrayType(1000);
//console.log(dataArray);
function receiveData() {
    let res = testLib.VCI_Receive(m_devtype, m_devind, m_canind,dataArray[0].ref(), 1000, 100);
    if(res>0 && dataArray[0].ID == 0x0CDA00F0){

    }
    //console.log(data);
}
setInterval(receiveData,2000);
