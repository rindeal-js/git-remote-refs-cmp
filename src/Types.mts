type HexString = string
type Oid = HexString
type Hostname = string
type RefName = string

type Milliseconds = number

type UnixTimeMs = number

type Count = number

type UserAgent = string

type GitRef = {
    name: RefName
    oid?: Oid
    symref?: RefName
    peeled?: Oid
    unborn?: boolean
}


export {
    Count,
    GitRef,
    HexString,
    Hostname,
    Milliseconds,
    Oid,
    RefName,
    UnixTimeMs,
    UserAgent,
}