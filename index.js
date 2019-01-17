const imageSize = require(`probe-image-size`)
const fs = require(`fs`)
const sha256 = require('js-sha256').sha256;

function createSignature(secretKey, expires) {
    var hash = sha256.create()
    hash.update(secretKey + expires);
    let uplySignature = hash.hex()
    return uplySignature
}


function generateSizes(maxWidth, imageWidth) {
    let steps = [
        0.25,
        0.5,
        1.5,
        2,
        3,
    ]

    var toReturn = steps.map(step => Math.round(maxWidth * step)).filter(step => step < imageWidth)

    if (toReturn.length < steps.length){
        toReturn.push(imageWidth)
    }
    return toReturn.map(step => `${step}w`)
}

function toArray(buf) {
    var arr = new Array(buf.length)

    for (var i = 0; i < buf.length; i++) {
        arr[i] = buf[i]
    }

    return arr
}

function getImageDimentions(absolutePath){
    return imageSize.sync(toArray(fs.readFileSync(absolutePath)))
}


async function fluid(url, options){
    var width = options.width
    var height = options.height

    var splited = url.name.split('.')
    var basename = splited[0]
    var extension = splited[1].toLowerCase()

    var aspectRatio = width / height

    var operations = ''
    if (options.jpegProgressive && (extension == 'jpeg' || extension == 'jpg')) {
        operations += ',progressive'
    }
    if (options.duotone) {
        operations += `,duotone:${options.duotone.highlight}:${options.duotone.shadow}`
    }
    if (options.grayscale) {
        operations += ',bw'
    }
    if (options.quality) {
        var quality = options.quality
        if (quality <= 0){
            quality = 1
        }
        else if (quality > 100) {
            quality = 100
        }
        operations += `,quality:${quality}`
    }
    if (options.rotate) {
        operations += `,rotate:${options.rotate}`
    }

    if (operations != '') {
        var srcWebp = `${url.base}/${operations.slice(1)}/${basename}.webp`
        var src = `${url.base}/${operations.slice(1)}/${url.name}`
    } else {
        var srcWebp = `${url.base}/${basename}.webp`
        var src = `${url.base}/${url.name}`
    }

    var srcSet = ''
    var srcSetWebp = ''

    var maxWidth = options.maxWidth
    if (maxWidth === undefined){
        maxWidth = 650
    }
    var sizes = `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`
    let _sizes = generateSizes(maxWidth, options.imageWidth)
    for (let i in _sizes){
        let step = _sizes[i]
        srcSet += `${url.base}/resize:${step}${operations}/${url.name} ${step},`
        srcSetWebp += `${url.base}/resize:${step}${operations}/${basename}.webp ${step},`
    }
    srcSet = srcSet.slice(0, -1).trim()
    srcSetWebp = srcSetWebp.slice(0, -1).trim()

    var originalName = url.name

    return {
        aspectRatio,
        height,
        originalName,
        sizes,
        src,
        srcSet,
        srcSetWebp,
        srcWebp,
        width,
    }
}

exports.fluid = fluid
exports.getImageDimentions = getImageDimentions
exports.createSignature = createSignature
