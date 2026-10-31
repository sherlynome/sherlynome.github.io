# 字体说明

## 站酷快乐体 ZCOOL KuaiLe

- 来源：https://github.com/googlefonts/zcool-kuaile
- 授权：SIL Open Font License 1.1 —— **可免费商用**（含网页嵌入、再分发；不可单独售卖字体本身）
- 版权：Copyright 2018 The ZCOOL KuaiLe Project Authors
- 授权全文：https://openfontlicense.org

页面用的是 `kuaile-subset.woff2`（30KB），由 `../make_font_subset.py` 从原始 TTF
按 `index.html` 实际用字裁剪生成，不依赖任何 CDN。

## 改完页面文字后

新加的字如果不在子集里，浏览器会回退到系统字体（看起来会不一致）。重新生成：

```bash
python make_font_subset.py
```

需要先把原始字体放到 `fonts/_src/ZCOOLKuaiLe-Regular.ttf`（下载地址见上）。
