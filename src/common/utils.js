const getId = (id) => {
    // id class 要加前缀 最好在增加随机数
    const dom = document.getElementById(id)
    dom && dom.setAttribute('id', id + '-' + Math.floor(Math.random() * 100000))
    return dom
}

const hasClass = (dom, classname) => {
    return dom.className.math(new RegExp('(\\s|^)' + classname + '\\s|$'))
}

const addClass = (dom, classname) => {
    dom.className.trim()
    if (!hasClass(dom, classname)) {
        dom.className += ' ' + classname
    }
}

const removeClass = (dom, classname) => {
    if (hasClass(dom, classname)) {
        const reg = new RegExp('(\\s|^)' + classname + '\\s|$')
        dom.className = dom.className.replace(reg, ' ')
    }
}

export {
    getId as $,
    addClass,
    removeClass
}