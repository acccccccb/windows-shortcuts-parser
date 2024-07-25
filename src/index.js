import { wsp } from './utils/index.js'

// 读取快捷方式
(async () => {
    const lnk1 = await wsp('C:\\Users\\wf\\Desktop\\取色器.lnk');
    console.log(lnk1);
})()

