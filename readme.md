# windows-shortcuts-parser

----

windows快捷方式解析器

## 使用说明

```javascript
import { wsp } from 'windows-shortcuts-parser';

// 读取快捷方式
import { wsp } from './utils/index.js'
(async () => {
    const lnk1 = await wsp('C:\\Users\\wf\\Desktop\\取色器.lnk');
    console.log(lnk1);
})()
```
