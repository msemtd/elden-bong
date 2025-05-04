/**
 * https://gamma.cs.unc.edu/POWERPLANT/papers/ply.pdf
 * format ascii 1.0
 * format binary_little_endian 1.0
 * format binary_big_endian 1.0
 * have a "general" PLY reader - we are just reading tables of numbers
 * (into buffers or streams) and saving small amounts of metadata into objects
 * These could be small tables too! Just shared buffers like in WebGL.
 *
 * To make this work
 * - get a header reader that slurps the entire header
 * - use readline, use streams?
 * - I want to read block by block from massive steams
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
 * - read with node file system APIs and pass blocks of memory to renderer process
 * - allow the renderer to control the rate of data transfer?
 *
 * - configurations for properties with well-known-text names, x, y, z, r, g, b, etc.
 * - mappings for other properties, e.g. normals
 */

const td1 = {
  header: `ply
format ascii 1.0
comment this file is a cube
element vertex 8
property float x
property float y
property float z
element face 6
property list uchar int vertex_indices
end_header
0 0 0
0 0 1
0 1 1
0 1 0
1 0 0
1 0 1
1 1 1
1 1 0
4 0 1 2 3
4 7 6 5 4
4 0 4 5 1
4 1 5 6 2
4 2 6 7 3
4 3 7 4 0
`
}

const testTrj = {
  header: `ply
format ascii 1.0
comment this file is a trajectory with a transform
element world_transform 1
property float t
property float x
property float y
property float z
property float qw
property float qx
property float qy
property float qz
element pose_event 8
property float t
property float x
property float y
property float z
property float qw
property float qx
property float qy
property float qz
end_header
0 0 0
0 0 1
0 1 1
0 1 0
1 0 0
1 0 1
1 1 1
1 1 0
4 0 1 2 3
4 7 6 5 4
4 0 4 5 1
4 1 5 6 2
4 2 6 7 3
4 3 7 4 0
`
}

const possibleFormats = ['ascii', 'binary_little_endian', 'binary_big_endian']

export class Ply {
  // use a readable stream?
  constructor () {
    this.possibleFormats = possibleFormats
  }

  example () {
    this.header = td1.header
  }
}
