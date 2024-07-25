# windows-shortcuts-parser

----

windows快捷方式解析器

## 使用说明

```javascript
import { wsp } from 'windows-shortcuts-parser';

// 读取快捷方式
(async () => {
    const lnk1 = await wsp('C:\\Users\\wf\\Desktop\\取色器.lnk');
    console.log(lnk1);

    // 返回值
    () => (
        {
            ShellLinkHeader: {
                HeaderSize: 76,
                LinkCLSID: '00021401-0000-0000-c000-000000000046',
                LinkFlags: [
                    'IsUnicode',
                    'EnableTargetMetadata',
                    'DisableKnownFolderAlias',
                    'UnaliasOnSave',
                    'PreferEnvironmentPath',
                    'KeepLocalIDListForUNCTarget'
                ],
                FileAttributes: [ 'FILE_ATTRIBUTE_SPARSE_FILE' ],
                CreationTime: '2020-07-08 09:59:11',
                AccessTime: '2020-07-20 17:31:24',
                WriteTime: '2014-12-10 13:18:52',
                FileSize: 35306,
                IconIndex: 0,
                ShowCommand: 'SW_SHOWNORMAL',
                HotKey: ['ctrl', 'shift', 'c'],
                Reserved1: '0x0000',
                Reserved2: '0x00000000',
                Reserved3: '0x00000000'
            },
            ExtraData: { 
                Path: 'E:\\小工具\\取色器.exe', 
                Description: '备注111aaabbb' 
            }
        }
    )
})()
```
