# electron-CAN-DLL-demo
electron-CAN-DLL-demo

# 

## 简介  

本示例为electron nodejs调用dll的demo，包含结构体等数据类型的解析方式。   
主要包括以下内容 

* nodejs 调用动态库 dll （ffi-napi）
* C 数据类型的定义与转换，包括 数组 和结构体struct (ref-array-napi/ref-struct-napi )
* 大小端模式处理


有问题欢迎指正。 

# 目录
> 核心代码在 render.js

#


# 快速入门  

## 运行

```
$ git clone https://github.com/hedyma86/electron-CAN-DLL-demo.git 
$ npm install
$ npm start

```
运行即可看到效果

## 说明

> 本项目为针对某公司的CANalyst产品的特定开发项目（运行成功必须连接对应CAN硬件）。  
> doc目录中为该产品的官方dll说明文档。   

> 虽本项目运行成功依赖硬件，但仍希望本示例代码可以对开发 nodejs 调用 dll 有问题的朋友起到一些参考作用。
> 
