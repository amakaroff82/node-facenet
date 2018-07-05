import * as path    from 'path'

import {
  pythonBridge,
  PythonBridge,
}                   from 'python-bridge'

import {
  log,
  MODULE_ROOT,
}                   from '../config'

export type BoundingFiveNumber = [
  number, number, number, number, // x1, y1, x2, y2
  number                          // confidence
]
export type LandmarkRowList = number[][] // A 10 rows vector, each col is for a face.

export class PythonFacenet {
  public python3: PythonBridge

  private facenetInited = false
  private mtcnnInited   = false

  private SRC_DIRNAME   = __dirname
  // python -m venv $VENV: the directory of vent
  private VENV = path.join(MODULE_ROOT, 'python3')

  constructor() {
    log.verbose('PythonFacenet', 'constructor() SRC=%s', this.SRC_DIRNAME)

    this.initVenv()
    this.python3 = this.initBridge()
  }

  public initVenv(): void {
    log.verbose('PythonFacenet', `initVenv() to ${this.VENV}`)

    const PATH = `${this.VENV}/bin:` + process.env['PATH']

    Object.assign(process.env, {
      VIRTUAL_ENV: this.VENV,
      PATH,
    })

    delete process.env['PYTHONHOME']
  }

  public initBridge(): PythonBridge {
    log.verbose('PythonFacenet', 'initBridge()')

    const TF_CPP_MIN_LOG_LEVEL  = '2'  // suppress tensorflow warnings

    let PYTHONPATH = [
      `${this.VENV}/facenet/src`,
      this.SRC_DIRNAME,
    ].join(':')

    if (process.env['PYTHONPATH']) {
      PYTHONPATH += ':' + process.env['PYTHONPATH']
    }

    Object.assign(process.env, {
        PYTHONPATH,
        TF_CPP_MIN_LOG_LEVEL,
    })

    const bridge = pythonBridge({
      python: 'python'
    })

    return bridge
  }

  public async initFacenet(): Promise<void> {
    log.silly('PythonFacenet', 'initFacenet()')

    if (this.facenetInited) {
      return
    }

    const start = Date.now()
    await this.python3.ex`
      from facenet_bridge import FacenetBridge
      facenet_bridge = FacenetBridge()
      facenet_bridge.init()
    `
    log.silly('PythonFacenet', 'initFacenet() facenet_bridge.init() cost %d milliseconds',
                                Date.now() - start,
            )

    this.facenetInited = true
  }

  public async initMtcnn(): Promise<void> {
    log.silly('PythonFacenet', 'initMtcnn()')

    if (this.mtcnnInited) {
      return
    }

    const start = Date.now()
    // we need not to care about session.close()(?)
    await this.python3.ex`
      import sys
      sys.path.append('./python3/facenet/src')
      sys.path.append('./src/python3')
      from facenet_bridge import MtcnnBridge
      mtcnn_bridge = MtcnnBridge()
      mtcnn_bridge.init()
    `
    log.silly('PythonFacenet', 'initMtcnn() mtcnn_bridge.init() cost milliseconds.',
                                Date.now() - start,
            )

    this.mtcnnInited = true
  }

  public async quit(): Promise<void> {
    log.verbose('PythonFacenet', 'quit()')
    if (!this.python3) {
      throw new Error('no phthon3 bridge inited yet!')
    }

    await this.python3.end()
    this.mtcnnInited = this.facenetInited = false
  }

  /**
   *
   * @param imageData
   */
  public async align(
    imageData: ImageData,
  ): Promise<[BoundingFiveNumber[], LandmarkRowList]> {
    log.verbose('PythonFacenet', 'align(%dx%d)', imageData.width, imageData.height)
    await this.initMtcnn()

    const row   = imageData.height
    const col   = imageData.width
    const depth = imageData.data.length / row / col

    const base64Text = this.base64ImageData(imageData)

    let boundingBoxes: BoundingFiveNumber[]
    let landmarks: LandmarkRowList

    const start = Date.now();
    [boundingBoxes, landmarks] = await this.python3
      `mtcnn_bridge.align(${base64Text}, ${row}, ${col}, ${depth})`

    log.silly('PythonFacenet', 'align() mtcnn_bridge.align() cost %d milliseconds',
                                Date.now() - start,
            )

    return [boundingBoxes, landmarks]
  }

  /**
   *
   * @param image
   */
  public async embedding(imageData: ImageData): Promise<number[]> {
    log.verbose('PythonFacenet', 'embedding(%dx%d)',
                                  imageData.width,
                                  imageData.height,
                )

    if (!this.facenetInited) {
      await this.initFacenet()
    }

    const row   = imageData.height
    const col   = imageData.width
    const depth = imageData.data.length / row / col

    const base64Text = this.base64ImageData(imageData)

    const start = Date.now();

    const embedding: number[] = await this.python3
      `facenet_bridge.embedding(${base64Text}, ${row}, ${col}, ${depth})`

    log.silly('PythonFacenet', 'embedding() facenet_bridge.embedding() cost %d milliseconds',
                          Date.now() - start,
            )

    return embedding
  }

  // public async json_parse(text: string): Promise<any> {
  //   await this.initPythonBridge()
  //   await this.python.ex`from facenet_bridge import json_parse`
  //   return await this.python`json_parse(${text})`
  // }

  public async base64_to_image(
    text:   string,
    row:    number,
    col:    number,
    depth:  number,
  ): Promise<number[][][]> {
    // await this.initPythonBridge()
    await this.python3.ex
      `from facenet_bridge import base64_to_image`

    return await this.python3
      `base64_to_image(${text}, ${row}, ${col}, ${depth}).tolist()`
  }

  /**
   * Deal with big file(e.g. 4000 x 4000 JPEG)
   * the following method will cause NODEJS HEAP MEMORY OUT(>1.5GB)
   * https://github.com/nicolaspanel/numjs/issues/21#issuecomment-319301957
   *
   * MEMORY OUT 1: image.flatten()
   * MEMORY OUT 2: [].concat.apply([], arrays);
   * MEMORY OUT 3: image.reshape()
   *
   * @param image
   */
  public base64ImageData(imageData: ImageData): string {

    return Buffer.from(imageData.data.buffer as ArrayBuffer)
                .toString('base64')

    // const [row, col, depth] = image.shape

    // const typedData = new Uint8ClampedArray(row * col * depth)

    // let n = 0
    // for (let i = 0; i < row; i++) {
    //   for (let j = 0; j < col; j++) {
    //     for (let k = 0; k < depth; k++) {
    //       typedData[n++] = image.get(i, j, k) as any as number
    //     }
    //   }
    // }

    // const base64Text = Buffer.from(typedData.buffer)
    //                         .toString('base64')
    // return base64Text
  }
}
