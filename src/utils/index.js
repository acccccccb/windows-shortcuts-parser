// filetime 转 datetime
import iconv from "iconv-lite";
import { readFile } from 'fs';

export const fileTimeToDateTime = (buffer) => {
    const fileTime = buffer.readBigUInt64LE(0) / 10_000n; // 毫秒
    const epochStart = BigInt(new Date('1601-01-01T00:00:00Z').getTime());

    const dateTime = new Date(Number(fileTime + epochStart));

    const year = dateTime.getFullYear();
    const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = dateTime.getDate().toString().padStart(2, '0');
    const hour = dateTime.getHours().toString().padStart(2, '0');
    const minute = dateTime.getMinutes().toString().padStart(2, '0');
    const second = dateTime.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
export const abToHexArr = (buffer) => {
    return Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2);
        }
    );
};

// LinkFlags解析器
export const linkFlagsParse = (buffer) => {
    const linkFlags = [
        "HasLinkTargetIDList",
        "HasLinkInfo",
        "HasName",
        "HasRelativePath",
        "HasWorkingDir",
        "HasArguments",
        "HasIconLocation",
        "IsUnicode",
        "ForceNoLinkInfo",
        "HasExpString",
        "RunInSeparateProcess",
        "Unused1",
        "HasDarwinID",
        "RunAsUser",
        "HasExpIcon",
        "NoPidlAlias",
        "Unused2",
        "RunWithShimLayer",
        "ForceNoLinkTrack",
        "EnableTargetMetadata",
        "DisableLinkPathTracking",
        "DisableKnownFolderTracking",
        "DisableKnownFolderAlias",
        "AllowLinkToLink",
        "UnaliasOnSave",
        "PreferEnvironmentPath",
        "KeepLocalIDListForUNCTarget"
    ];

    const bin = buffer.readUInt32LE(0).toString(2).padStart(linkFlags.length, '0');
    const result = [];
    for(let i=0;i<bin.length;i++) {
        if(bin[i] === '1') {
            result.push(linkFlags[i]);
        }
    }
    return result;
}
//FileAttributes解析器
export const fileAttributesParse = (buffer) => {
    const fileAttributes = [
        "FILE_ATTRIBUTE_READONLY",
        "FILE_ATTRIBUTE_HIDDEN",
        "FILE_ATTRIBUTE_SYSTEM",
        "Reserved1",
        "FILE_ATTRIBUTE_DIRECTORY",
        "FILE_ATTRIBUTE_ARCHIVE",
        "Reserved2",
        "FILE_ATTRIBUTE_NORMAL",
        "FILE_ATTRIBUTE_TEMPORARY",
        "FILE_ATTRIBUTE_SPARSE_FILE",
        "FILE_ATTRIBUTE_REPARSE_POINT",
        "FILE_ATTRIBUTE_COMPRESSED",
        "FILE_ATTRIBUTE_OFFLINE",
        "FILE_ATTRIBUTE_NOT_CONTENT_INDEXED",
        "FILE_ATTRIBUTE_ENCRYPTED"
    ];
    const bin = buffer.readUInt32LE(0).toString(2).padStart(fileAttributes.length, '0');
    const result = [];
    for(let i=0;i<bin.length;i++) {
        if(bin[i] === '1') {
            result.push(fileAttributes[i]);
        }
    }
    return result;
}
export const bufferToStr = (buffer) => {
    return '0x'+ abToHexArr(buffer).reverse().join('').toString('hex');
}
export const showCommandParse = (buffer) => {
    const showCommandTyps = {
        '0x00000001': 'SW_SHOWNORMAL',
        '0x00000003': 'SW_SHOWMAXIMIZED',
        '0x00000007': 'SW_SHOWMINNOACTIVE',
    }
    return showCommandTyps[bufferToStr(buffer)]
}
export const hotKeyParse = (buffer) => {
    const hotKeyCode = buffer.readUInt16LE(0);
    if(hotKeyCode === 0) {
        return [];
    }
    const MOD_ALT = 0x04;
    const MOD_CONTROL = 0x02;
    const MOD_SHIFT = 0x01;

    const key = hotKeyCode & 0x00FF;
    const modifiers = (hotKeyCode & 0xFF00) >> 8;

    const isAlt = (modifiers & MOD_ALT) !== 0;
    const isCtrl = (modifiers & MOD_CONTROL) !== 0;
    const isShift = (modifiers & MOD_SHIFT) !== 0;
    return [String.fromCharCode(key), isAlt && 'alt', isCtrl && 'ctrl', isShift && 'shift'].filter(item => !!item);
}
export const extraDataParse = (buffer) => {
    const buf = buffer.slice(76);
    let result = null;
    for(let i=0; i<buf.length; i++) {
        if(i > 0 && i % 4 === 0) {
            const block = Buffer.from([buf[i-4], buf[i-3],buf[i-2],buf[i-1]])
            const value = block.readUInt32LE(0);
            if(value < 0x00000004) {
                result = buf.slice(0)
                break;
            }
        }
    }
    // return result ? result.toString() : null;
    return buffer.slice(368, 393).toString();
}

export const searchBufferIndex = (buffer, key, start = 0, comparisonType='==') => {
    const searchBuf = Buffer.from(key.join(''), 'hex');
    let result = -1;
    for(let i=start; i<buffer.length - searchBuf.length - 1; i++) {
        if(result >= 0) {
            break;
        }
        if(i > 0) {
            const block = buffer.slice(i, i + searchBuf.length);
            const hexStr = Array.from(block).map(item => item.toString(16).padStart(2, '0')).join('');
            const searchBufHexStr = Array.from(searchBuf).map(item => item.toString(16).padStart(2, '0')).join('');
            // console.log('@@@', block.readUInt16LE(0));

            switch (comparisonType) {
                case "==":
                    if(hexStr === searchBufHexStr) {
                        result = i;
                        break;
                    }
                    break;
                case "<=":
                    if(block.readUInt16LE(0) <= searchBuf.readUInt16LE(0)) {
                        result = i;
                        break;
                    }
                    break;
                case "description":
                    // console.log('key', key);
                    // console.log('block.readUInt16LE(0)', block.join('', 'hex'), searchBuf.join('', 'hex'));
                    const searchStr = key.join('', 'hex');
                    const matchStr = block.join('', 'hex');
                    const matchStart = searchStr[0] + searchStr[1];
                    const matchEnd = searchStr[searchStr.length -2] + searchStr[searchStr.length - 1];
                    if(searchStr.length === matchStr.length) {
                        console.log('searchStr',i, searchStr, matchStr);
                    }
                    if(searchStr.length === matchStr.length && matchStr.startsWith(matchStart) && matchStr.endsWith(matchEnd)) {
                        console.log('searchStr', searchStr, matchStr);
                        result = i;
                        break;
                    }
                    break;
            }
        }
    }
    return result;
}

export const searchBuffer = ({buffer, start, end, startComparisonType = '==', endComparisonType = '=='}) => {
    const left = searchBufferIndex(buffer, start,76, startComparisonType);
    const right = searchBufferIndex(buffer, end, left, endComparisonType);
    const result = buffer.slice(left + start.length, right);
    return result ? result : null;
}

export const bufferToUuid = (buffer) => {
    if(buffer.length !== 16) {
        return 'Err';
    }
    const buf = buffer;
    // 在 UUID 中，前 8 字节的字节序通常是小端字节序
    const part1 = buf.slice(0, 4).reverse().toString('hex');
    // 其余的字节（12 字节）保持大端字节序
    const part2 = buf.slice(4, 6).toString('hex');
    const part3 = buf.slice(6, 8).toString('hex');
    const part4 = buf.slice(8, 10).toString('hex');
    const part5 = buf.slice(10, 16).toString('hex');
    return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}


export const windowsShotcutParse = (buffer) => {
    const HeaderSize = buffer.slice(0, 4);
    const LinkCLSID = buffer.slice(4, 20);
    const LinkFlags = buffer.slice(20, 24);
    const FileAttributes = buffer.slice(24, 28);
    const CreationTime = buffer.slice(28, 36);
    const AccessTime = buffer.slice(36, 44);
    const WriteTime = buffer.slice(44, 52);
    const FileSize = buffer.slice(52, 56);
    const IconIndex = buffer.slice(56, 60);
    const ShowCommand = buffer.slice(60, 64);
    const HotKey = buffer.slice(64, 66);
    const Reserved1 = buffer.slice(66, 68);
    const Reserved2 = buffer.slice(68, 72);
    const Reserved3 = buffer.slice(72, 76);
    const ExtraData = buffer;
    const LinkTargetIDList = buffer;

    const path = iconv.decode(searchBuffer({
        buffer,
        start: ['C5', 'CC', '00'],
        end: ['00', '00'],
        startComparisonType: '==',
        endComparisonType: '==',
    }), 'gbk');
    const pathStart = ['C5', 'CC', '00'];
    const pathEnd = ['00', '00'];
    const pathIndexStart = searchBufferIndex(buffer, pathStart);
    const pathIndexEnd = searchBufferIndex(buffer, pathEnd, pathIndexStart + pathStart.length);

    const descriptionStart = ['00'];
    const descriptionEnd = ['00', '00'];
    const descriptionIndexStart = searchBufferIndex(buffer, descriptionStart, pathIndexEnd + pathEnd.length);

    let description = null;
    if(descriptionIndexStart>-1) {
        const descriptionIndexEnd = searchBufferIndex(buffer, descriptionEnd, descriptionIndexStart + descriptionStart.length + 1);
        description = iconv.decode(buffer.slice(descriptionIndexStart + descriptionStart.length, descriptionIndexEnd - 1), 'utf-16le');
        if(description) {
            description = description.replace(/[a-zA-Z]:\\.*$/, '');
            description = description.replace(/[\x00-\x1F\x7F]/g, '');
        }
    }

    const result = {
        ShellLinkHeader: {
            HeaderSize: HeaderSize.readUInt16LE(0),
            LinkCLSID : bufferToUuid(LinkCLSID),
            LinkFlags : linkFlagsParse(LinkFlags),
            FileAttributes : fileAttributesParse(FileAttributes),
            CreationTime: fileTimeToDateTime(CreationTime),
            AccessTime: fileTimeToDateTime(AccessTime),
            WriteTime: fileTimeToDateTime(WriteTime),
            FileSize: FileSize.readUInt16LE(0),
            IconIndex: IconIndex.readUInt16LE(0),
            ShowCommand: showCommandParse(ShowCommand),
            HotKey: hotKeyParse(HotKey),
            Reserved1: bufferToStr(Reserved1),
            Reserved2: bufferToStr(Reserved2),
            Reserved3: bufferToStr(Reserved3),
            // LinkTargetIDList: bufferToStr(LinkTargetIDList),
        },

        // ExtraData: bufferToStr(ExtraData),
        // custom
        extraData: {
            path,
            description,
        }
    }
    return result;
}

export const wsp = (filePath) => {
    return new Promise((resolve, reject) => {
        readFile(filePath, (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                reject(err);
            } else {
                resolve(windowsShotcutParse(data));
            }
        });
    })
}

