(function(ref) {
	var Mp4Boxer = function() {
		this.constants = {
			FTYP: new Uint8Array([0x69, 0x73, 0x6F, 0x6D, // major_brand: isom
				0x0, 0x0, 0x0, 0x1, // minor_version: 0x01
				0x69, 0x73, 0x6F, 0x6D, // isom
				0x61, 0x76, 0x63, 0x31 // avc1
			]),
			STSD_PREFIX: new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x01 // entry_count
			]),
			STTS: new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x00 // entry_count
			]),
			STSZ: new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x00, // sample_size
				0x00, 0x00, 0x00, 0x00 // sample_count
			]),
			HDLR_AUDIO: new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x00, // pre_defined
				0x73, 0x6F, 0x75, 0x6E, // handler_type: 'soun'
				0x00, 0x00, 0x00, 0x00, // reserved: 3 * 4 bytes
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x53, 0x6F, 0x75, 0x6E, 0x64, 0x48, 0x61, 0x6E, 0x64, 0x6C, 0x65, 0x72, 0x00 // name: SoundHandler
			]),
			DREF: new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x01, // entry_count
				0x00, 0x00, 0x00, 0x0C, // entry_size
				0x75, 0x72, 0x6C, 0x20, // type 'url '
				0x00, 0x00, 0x00, 0x01 // version(0) + flags
			]),
			// Sound media header
			SMHD: new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x00 // balance(2) + reserved(2)
			])
		};
		this.constants.STSC = this.constants.STCO = this.constants.STTS;
		this.types = {
			dinf: [], dref: [], esds: [], ftyp: [], hdlr: [],
			mdat: [], mdhd: [], mdia: [], mfhd: [], minf: [], moof: [], moov: [], mp4a: [], mvex: [], mvhd: [],
			sdtp: [], smhd: [], stbl: [], stco: [], stsc: [], stsd: [], stsz: [], stts: [],
			tfdt: [], tfhd: [], tkhd: [], traf: [], trak: [], trex: [], trun: []
		};
		for (var name in this.types) {
			if (this.types.hasOwnProperty(name)) {
				this.types[name] = [name.charCodeAt(0), name.charCodeAt(1), name.charCodeAt(2), name.charCodeAt(3)];
			}
		}
		this.pack = function(type) {
			var size = 8;
			var data = Array.prototype.slice.call(arguments, 1);
			for (var i = 0; i < data.length; i++) {
				size += data[i].byteLength;
			}
			var result = new Uint8Array(size);
			result[0] = size >>> 24 & 0xFF;
			result[1] = size >>> 16 & 0xFF;
			result[2] = size >>> 8 & 0xFF;
			result[3] = size & 0xFF;
			result.set(type, 4);
			var offset = 8;
			for (i = 0; i < data.length; i++) {
				result.set(data[i], offset);
				offset += data[i].byteLength;
			}
			return result;
		};

		this.meta = function(data) {
            var ftyp = this.pack(this.types.ftyp, this.constants.FTYP);
            var moov = this.moov(data);
            var result = new Uint8Array(ftyp.byteLength + moov.byteLength);
            result.set(ftyp, 0);
            result.set(moov, ftyp.byteLength);
            return result;
        };

	    // Data infomation box
        this.dinf = function() {
            return this.pack(this.types.dinf, this.pack(this.types.dref, this.constants.DREF));
        };
		this.esds = function(data) {
            var packData = new Uint8Array([0x00, 0x00, 0x00, 0x00, // version 0 + flags
					0x03, // descriptor_type
					0x17 + data.esds.length, // length3
					0x00, 0x01, // es_id
					0x00, // stream_priority
					0x04, // descriptor_type
					0x0F + data.esds.length, // length
					0x40, // codec: mpeg4_audio
					0x15, // stream_type: Audio
					0x00, 0x00, 0x00, // buffer_size
					0x00, 0x00, 0x00, 0x00, // maxBitrate
					0x00, 0x00, 0x00, 0x00, // avgBitrate
					0x05 // descriptor_type
				].concat([data.esds.length]).concat(data.esds).concat([0x06, 0x01, 0x02 // GASpecificConfig
            ]));
            return this.pack(this.types.esds, packData);
        };
        // Media handler reference box
		this.hdlr = function() {
            return this.pack(this.types.hdlr, this.constants.HDLR_AUDIO);
        };
		this.mdia = function (data) {
            return this.pack(this.types.mdia, this.mdhd(1000, 0), this.hdlr(data), this.minf(data));
        };
		this.mdhd = function(timescale, duration) {
            return this.pack(this.types.mdhd, new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x00, // creation_time
				0x00, 0x00, 0x00, 0x00, // modification_time
				timescale >>> 24 & 0xFF, // timescale: 4 bytes
				timescale >>> 16 & 0xFF, timescale >>> 8 & 0xFF, timescale & 0xFF, duration >>> 24 & 0xFF, // duration: 4 bytes
				duration >>> 16 & 0xFF, duration >>> 8 & 0xFF, duration & 0xFF, 0x55, 0xC4, // language: und (undetermined)
				0x00, 0x00 // pre_defined = 0
            ]));
        };
		// Media data box
		this.mdat = function(data) {
			return this.pack(this.types.mdat, data);
		};		
        // Media infomation box
		this.minf = function(data) {
            return this.pack(this.types.minf, this.pack(this.types.smhd, this.constants.SMHD), this.dinf(), this.stbl(data));
        };
		this.mp4a = function(data) {
            var packData = new Uint8Array([0x00, 0x00, 0x00, 0x00, // reserved(4)
            0x00, 0x00, 0x00, 0x01, // reserved(2) + data_reference_index(2)
            0x00, 0x00, 0x00, 0x00, // reserved: 2 * 4 bytes
            0x00, 0x00, 0x00, 0x00, 0x00, (data.channelCount || 1), // channelCount(2)
            0x00, 0x10, // sampleSize(2)
            0x00, 0x00, 0x00, 0x00, // reserved(4)
            data.samplingRate >>> 8 & 0xFF, // Audio sample rate
            data.samplingRate & 0xFF, 0x00, 0x00]);
            return this.pack(this.types.mp4a, packData, this.esds(data));
        };
		this.moov = function(data) {
            return this.pack(this.types.moov, this.mvhd(1000, 0), this.trak(data), this.mvex(data));
        };
		this.moof = function (track, firstDts) {
			return this.pack(this.types.moof, this.mfhd(track.seqNum), this.traf(track, firstDts));
		};
		this.mfhd = function (seqNum) {
			return this.pack(this.types.mfhd, new Uint8Array([0x00, 0x00, 0x00, 0x00, seqNum >>> 24 & 0xFF, seqNum >>> 16 & 0xFF, seqNum >>> 8 & 0xFF, seqNum & 0xFF]));
		};
		this.mvex = function(data) {
            return this.pack(this.types.mvex, this.trex(data));
        };
		this.mvhd = function(timescale, duration) {
            return this.pack(this.types.mvhd, new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				0x00, 0x00, 0x00, 0x00, // creation_time
				0x00, 0x00, 0x00, 0x00, // modification_time
				timescale >>> 24 & 0xFF, // timescale: 4 bytes
				timescale >>> 16 & 0xFF, timescale >>> 8 & 0xFF, timescale & 0xFF, duration >>> 24 & 0xFF, // duration: 4 bytes
				duration >>> 16 & 0xFF, duration >>> 8 & 0xFF, duration & 0xFF, 0x00, 0x01, 0x00, 0x00, // Preferred rate: 1.0
				0x01, 0x00, 0x00, 0x00, // PreferredVolume(1.0, 2bytes) + reserved(2bytes)
				0x00, 0x00, 0x00, 0x00, // reserved: 4 + 4 bytes
				0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, // ----begin composition matrix----
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, // ----end composition matrix----
				0x00, 0x00, 0x00, 0x00, // ----begin pre_defined 6 * 4 bytes----
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // ----end pre_defined 6 * 4 bytes----
				0xFF, 0xFF, 0xFF, 0xFF // next_track_ID
			]));
		};
		this.sdtp = function(track) {
			var samples = track.samples || [];
			var sampleCount = samples.length;
			var data = new Uint8Array(4 + sampleCount);
			// 0~4 bytes: version(0) & flags
			for (var i = 0; i < sampleCount; i++) {
				var flags = samples[i].flags;
				data[i + 4] = flags.isLeading << 6 | // is_leading: 2 (bit)
				flags.dependsOn << 4 // sample_depends_on
				| flags.isDependedOn << 2 // sample_is_depended_on
				| flags.hasRedundancy; // sample_has_redundancy
			}
			return this.pack(this.types.sdtp, data);
		};
        this.stbl = function(data) {
            var result = this.pack(this.types.stbl, // type: stbl
				this.stsd(data), // Sample Description Table
				this.pack(this.types.stts, this.constants.STTS), // Time-To-Sample
				this.pack(this.types.stsc, this.constants.STSC), // Sample-To-Chunk
				this.pack(this.types.stsz, this.constants.STSZ), // Sample size
				this.pack(this.types.stco, this.constants.STCO // Chunk offset
            ));
            return result;
        };
        // Sample description box
        this.stsd = function(data) {
			// else: aac -> mp4a
			return this.pack(this.types.stsd, this.constants.STSD_PREFIX, this.mp4a(data));
        };
		this.tkhd = function(data) {
            var trackId = data.id || 1, duration = data.duration || 0;
            var width = data.width || 0, height = data.height || 0;
            return this.pack(this.types.tkhd, new Uint8Array([0x00, 0x00, 0x00, 0x07, // version(0) + flags
            0x00, 0x00, 0x00, 0x00, // creation_time
            0x00, 0x00, 0x00, 0x00, // modification_time
            trackId >>> 24 & 0xFF, // track_ID: 4 bytes
            trackId >>> 16 & 0xFF, trackId >>> 8 & 0xFF, trackId & 0xFF, 0x00, 0x00, 0x00, 0x00, // reserved: 4 bytes
            duration >>> 24 & 0xFF, // duration: 4 bytes
            duration >>> 16 & 0xFF, duration >>> 8 & 0xFF, duration & 0xFF, 0x00, 0x00, 0x00, 0x00, // reserved: 2 * 4 bytes
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // layer(2bytes) + alternate_group(2bytes)
            0x00, 0x00, 0x00, 0x00, // volume(2bytes) + reserved(2bytes)
            0x00, 0x01, 0x00, 0x00, // ----begin composition matrix----
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, // ----end composition matrix----
            width >>> 8 & 0xFF, // width and height
            width & 0xFF, 0x00, 0x00, height >>> 8 & 0xFF, height & 0xFF, 0x00, 0x00]));
		};
		this.traf = function (track, firstDts) {
			// header box
			// version(0) & flags
			var tfhd = this.pack(this.types.tfhd, new Uint8Array([0x00, 0x00, 0x00, 0x00, track.id >>> 24 & 0xFF, track.id >>> 16 & 0xFF, track.id >>> 8 & 0xFF, track.id & 0xFF]));
			// decode time int32
			var tfdt = this.pack(this.types.tfdt, new Uint8Array([0x00, 0x00, 0x00, 0x00, firstDts >>> 24 & 0xFF, firstDts >>> 16 & 0xFF, firstDts >>> 8 & 0xFF, firstDts & 0xFF]));
			var sdtp = this.sdtp(track);
			var trun = this.trun(track, sdtp.byteLength + 16 + 16 + 8 + 16 + 8 + 8);
			return this.pack(this.types.traf, tfhd, tfdt, trun, sdtp);
		};
		this.trak = function(data) {
            return this.pack(this.types.trak, this.tkhd(data), this.mdia(data));
        };
		this.trex = function(data) {
            var trackId = data.id || 1;
            var packData = new Uint8Array([0x00, 0x00, 0x00, 0x00, // version(0) + flags
				trackId >>> 24 & 0xFF, // track_ID
				trackId >>> 16 & 0xFF, trackId >>> 8 & 0xFF, trackId & 0xFF, 0x00, 0x00, 0x00, 0x01, // default_sample_description_index
				0x00, 0x00, 0x00, 0x00, // default_sample_duration
				0x00, 0x00, 0x00, 0x00, // default_sample_size
				0x00, 0x01, 0x00, 0x01 // default_sample_flags
			]);
            return this.pack(this.types.trex, packData);
        };
		this.trun = function(track, offset) {
			var samples = track.samples || [];
			var dataSize = 12 + 16 * samples.length;
			var data = new Uint8Array(dataSize);
			offset += 8 + dataSize;
			data.set([0x00, 0x00, 0x0F, 0x01, // version(0) & flags
			samples.length >>> 24 & 0xFF, // sample_count
			samples.length >>> 16 & 0xFF, samples.length >>> 8 & 0xFF, samples.length & 0xFF, offset >>> 24 & 0xFF, // data_offset
			offset >>> 16 & 0xFF, offset >>> 8 & 0xFF, offset & 0xFF], 0);
			for (var i = 0; i < samples.length; i++) {
				var duration = samples[i].duration;
				var size = samples[i].length;
				var flags = samples[i].flags;
				var cts = samples[i].cts || 0;
				data.set([duration >>> 24 & 0xFF, duration >>> 16 & 0xFF, duration >>> 8 & 0xFF, duration & 0xFF, // sample_duration
				size >>> 24 & 0xFF, size >>> 16 & 0xFF, size >>> 8 & 0xFF, size & 0xFF, // sample_size
				flags.isLeading << 2 | flags.dependsOn, flags.isDependedOn << 6 | flags.hasRedundancy << 4 | flags.isNonSync, // sample_flags
				0x00, 0x00, // sample_degradation_priority
				cts >>> 24 & 0xFF, // sample_composition_time_offset
				cts >>> 16 & 0xFF, cts >>> 8 & 0xFF, cts & 0xFF], 12 + 16 * i);
			}
			return this.pack(this.types.trun, data);
		};
	};
	var FlvDemuxer = function(options) {
		var le = (function () {
            var buf = new ArrayBuffer(2);
            new DataView(buf).setInt16(0, 256, true);
            return new Int16Array(buf)[0] === 256;
        })();
		var emitter = 'FlvDemuxer';
		var hasVideo = false, hasAudio = false;
		var naluLengthSize = 0, naluHeader = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
		var keyFramesOnly = false;
		this.videoTrack = {samples: [], length: 0, dtsOffset: null, lastDts: null, fps: null, framePeriod: null, codec: null, mimeCodec: null, seqNum: 0};
		this.audioTrack = {samples: [], length: 0, dtsOffset: null, lastDts: null, fps: null, framePeriod: null, codec: null, mimeCodec: null, seqNum: 0};
		this.parseChunk = function(chunk, byteStart) {
			var offset = 0;
			if (byteStart === 0) {
				if (chunk.byteLength > 13) {
                    offset = this.probe(chunk);
                }
				if (offset === 0) {
                    console.warn(emitter + '.parseChunk: probe returns empty offset');
					return 0;
                }
                var prevTagSize = (new DataView(chunk, offset)).getUint32(0, !le);
                if (prevTagSize !== 0) {
                    console.warn(emitter + '.parseChunk: size of previous tag not empty');
                }
                offset += 4;				
			}
			while (offset < chunk.byteLength) {
				var v = new DataView(chunk, offset);
				if ((offset + 15) > chunk.byteLength) {
                    // console.log(emitter + '.parseChunk: data not enough for parsing flv tag');
					break;
                }
                var tagType = v.getUint8(0);
                var dataSize = v.getUint32(0, !le) & 0x00FFFFFF;
                if ((offset + 11 + dataSize + 4) > chunk.byteLength) {
                    // data not enough for parsing actual data body
                    break;
                }
				if (tagType !== 8 && tagType !== 9 && tagType !== 18) {
                    console.warn(emitter + '.parseChunk: unsupported tag type ' + tagType + ', skipped');
                    offset += 11 + dataSize + 4;
                    continue;
                }
                var timestamp = v.getUint8(6) | (v.getUint8(5) << 8) | (v.getUint8(4) << 16) | (v.getUint8(7) << 24);
                var dataOffset = offset + 11;
                switch (tagType) {
                    case 8:
						this.parseAudioData(chunk, dataOffset, dataSize, timestamp);
                        break;
                    case 9:
						this.parseVideoData(chunk, dataOffset, dataSize, timestamp, byteStart + offset);
                        break;
                    default:
                        break;
                }
                var prevTagSize = v.getUint32(11 + dataSize, !le);
                if (prevTagSize !== (11 + dataSize)) {
                    console.warn(emitter + '.parseChunk: invalid previous tag size ' + prevTagSize);
                }
                offset += 11 + dataSize + 4;			
			}
			return offset;
		};
		this.probe = function(buffer) {
            var data = new Uint8Array(buffer);
            if (data[0] !== 0x46 || data[1] !== 0x4C || data[2] !== 0x56 || data[3] !== 0x01) {
                return 0;
            }
			hasAudio = (data[4] & 4) >>> 2 !== 0 && (typeof options === 'object' && options.audio == true);
            hasVideo = (data[4] & 1) !== 0;
            var offset = data[5] << 24 | data[5 + 1] << 16 | data[5 + 2] << 8 | data[5 + 3];
            if (offset < 9) {
                return 0;
            } 
            return offset;
		};
		this.parseVideoData = function(buffer, dataOffset, dataSize, tagTimestamp, tagPosition) {
            if (dataSize <= 1) {
                console.warn(emitter + '.parseVideoData: invalid video packet, missing video payload!');
                return;
            }
            var spec = new Uint8Array(buffer, dataOffset, dataSize)[0];
            var codecId = spec & 15;
            if (codecId !== 7 && codecId !== 10) {
                console.error(emitter + '.parseVideoData: unsupported codec ' + codecId + ' in video frame');
                return;
            }
			if (dataSize < 5) {
                console.warn(emitter + '.parseVideoData: invalid AVC/HEVC packet, missing packet type or/and composition time');
                return;
            }
            var dv = new DataView(buffer, dataOffset + 1, dataSize - 1);
            var packetType = dv.getUint8(0);
            var cts = 0; //(dv.getUint32(0, !le) & 0x00FFFFFF) << 8 >> 8;
			if (packetType === 0) {
				if (codecId === 7 && dataSize < 12 || dataSize < 5) {
					console.warn(emitter + '.parseVideoData: invalid AVC/HEVC configuration');
					return;
				}
				if (codecId === 7) {
					dv = new DataView(buffer, dataOffset + 5, dataSize - 5);
					naluLengthSize = (dv.getUint8(4) & 3) + 1;
					this.videoTrack.codec = 'avc1';
					if (naluLengthSize !== 3 && naluLengthSize !== 4) {
						console.error(emitter + '.parseVideoData: strange NaluLengthSizeMinusOne: ' + (naluLengthSize - 1));
						return;
					}
				} else {
					naluLengthSize = 4;
					this.videoTrack.codec = 'hvc1';
				}
				if (typeof options === 'object' && typeof options.onMetaData === 'function') {
					options.onMetaData.call(this);
				}
			} else if (packetType === 1) {
				var vDataSize = dataSize - 5, vDataOffset = dataOffset + 5;
				dv = new DataView(buffer, vDataOffset, vDataSize);
				var isKeyframe = ((spec & 240) >>> 4) === 1;
				if (isKeyframe === false && keyFramesOnly && this.videoTrack.dtsOffset !== null) {
					return;
				}
				var offset = 0, naluSize = 0, udata = new Uint8Array(0), utemp;
				while (offset < vDataSize) {
					if ((offset + 4) >= vDataSize) {
						console.error(emitter + '.parseVideoData: malformed Nalu near timestamp ' + tagTimestamp + ', offset = ' + offset + ', dataSize = ' + vDataSize);
						break;
					}
					naluSize = dv.getUint32(offset, !le);
					if (naluLengthSize === 3) {
						naluSize >>>= 8;
					}
					if (naluSize > (vDataSize - naluLengthSize)) {
						console.error(emitter + '.parseVideoData: malformed Nalus near timestamp ' + tagTimestamp);
						return;
					}
					/*
					if (isKeyframe === false) {
						if (this.videoTrack.codec === 'avc1') {
							if ((dv.getUint8(offset + naluLengthSize) & 0x1F) === 5) {
								isKeyframe = true;
							}
						} else if ((dv.getUint8(offset + naluLengthSize) & 0x7e) >>> 1 === 19 || (dv.getUint8(offset + naluLengthSize) & 0x7e) >>> 1 === 20) {
							isKeyframe = true;
						}
					}
					*/
					utemp = udata;
					udata = new Uint8Array(utemp.length + naluHeader.length + naluSize);
					if (utemp.length) {
						udata.set(utemp, 0);
					}
					udata.set(naluHeader, utemp.length);
					udata.set(new Uint8Array(buffer, vDataOffset + offset + naluLengthSize, naluSize), utemp.length + naluHeader.length);
					offset += (naluLengthSize + naluSize);
				}
				if (udata.byteLength) {
					var sample = {
						data: udata,
						length: udata.byteLength,
						isKeyframe: isKeyframe,
						dts: tagTimestamp,
						cts: cts,
						pts: tagTimestamp + cts
					};
					if (isKeyframe) {
						this.videoTrack.dtsOffset = this.videoTrack.lastDts || 0;
						//sample.fileposition = tagPosition;
					}
					if (isKeyframe || !keyFramesOnly) {
						this.videoTrack.samples.push(sample);
						this.videoTrack.length += sample.length;
					}
					if (this.videoTrack.lastDts !== null && this.videoTrack.lastDts !== sample.dts) {
						this.videoTrack.framePeriod = sample.dts - this.videoTrack.lastDts;
						this.videoTrack.fps = Math.floor(1 / this.videoTrack.framePeriod * 1000);
					}
					this.videoTrack.lastDts = sample.dts;
				}
            } else {
				if (packetType !== 2) {
					console.warn(emitter + '.parseVideoData: invalid video packet type ' + packetType);	
				}
				return;
			}
        };
		this.parseAudioData = function(buffer, dataOffset, dataSize, tagTimestamp) {
            if (hasAudio === false) {
				return;
			}
			if (dataSize <= 1) {
				console.warn(emitter + '.parseAudioData: invalid audio packet, missing payload');
                return;
            }
			var dv = new DataView(buffer, dataOffset, dataSize);
            var codecId = dv.getUint8(0) >>> 4;
            if (codecId !== 2 && codecId !== 10) {// MP3 or AAC
				console.warn(emitter + '.parseAudioData: unsupported codec ' + codecId + ' in audio frame');
                return;
            }
			var udata = null;
			if (this.audioTrack.codec === null) {
				if (codecId !== 2) {
					this.audioTrack.codec = 'aac';
					this.audioTrack.mimeCodec = 'audio/mp4';					
					if (dataSize <= 2) {
						console.warn(emitter + '.parseAudioData: invalid AAC packet, missing packetType and/or payload');
						return;
					}
					udata = new Uint8Array(buffer, dataOffset + 1, dataSize - 1);
					if (udata[0] === 0) {
						udata = udata.slice(1);
						samplingIndex = (udata[0] & 0x07) << 1 | udata[1] >>> 7;
						var samplingRates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
						if (samplingIndex < 0 || samplingIndex >= samplingRates.length) {
							console.warn(emitter + '.parseAudioData: invalid AAC sampling frequency index');
							return;
						}
						var channelCount = (udata[1] & 0x78) >>> 3;
						if (channelCount < 0 || channelCount >= 8) {
							console.warn(emitter + '.parseAudioData: invalid AAC channel configuration');
							return;
						}
						var objectType = (udata[0] >>> 3);
						this.audioTrack.framePeriod = 1024 / samplingRates[samplingIndex] * 1000;
						this.audioTrack.samplingRate = samplingRates[samplingIndex];
						this.audioTrack.channelCount = channelCount;

						// workarounds for various browsers
						var extSamplingIndex = samplingIndex;
						if (objectType === 5) {
							extSamplingIndex = (udata[1] & 0x07) << 1 | udata[2] >>> 7; // HE-AAC? 4 bits
						}						
						var userAgent = window.navigator.userAgent.toLowerCase();
						if (userAgent.indexOf('firefox') !== -1) {
							if (samplingIndex >= 6) {
								this.audioTrack.esds = new Array(4);
								objectType = 5; // use SBR (HE-AAC) if freq less than 24kHz
								extSamplingIndex = samplingIndex - 3;
							} else {
								this.audioTrack.esds = new Array(2);
								objectType = 2; // use LC-AAC
							}
						} else if (userAgent.indexOf('android') !== -1) {
							this.audioTrack.esds = new Array(2);
							objectType = 2; // always use LC-AAC
						} else {
							// use HE-AAC to make it easier to switch aac codec profile
							this.audioTrack.esds = new Array(4);
							objectType = 5;
							if (samplingIndex >= 6) {
								extSamplingIndex = samplingIndex - 3;
							} else if (channelCount === 1) {
								this.audioTrack.esds = new Array(2);
								objectType = 2;
							}
						}
						this.audioTrack.mimeCodec += ';codecs=mp4a.40.' + objectType;
						this.audioTrack.esds[0] = objectType << 3;
						this.audioTrack.esds[0] |= (samplingIndex & 0x0F) >>> 1;
						this.audioTrack.esds[1] = (samplingIndex & 0x0F) << 7;
						this.audioTrack.esds[1] |= (channelCount & 0x0F) << 3;
						if (objectType === 5) {
							this.audioTrack.esds[1] |= (extSamplingIndex & 0x0F) >>> 1;
							this.audioTrack.esds[2] = (extSamplingIndex & 0x01) << 7;
							this.audioTrack.esds[2] |= 2 << 2; // extended audio object type: force to 2 (LC-AAC)
							this.audioTrack.esds[3] = 0;
						}
					}
				} else {
					this.audioTrack.codec = 'mpeg';
					this.audioTrack.mimeCodec = 'audio/mpeg';
				}
				if (typeof options === 'object' && typeof options.onMetaData === 'function') {
					options.onMetaData.call(this);
				}
			}
			if (codecId !== 2) {
				if (dataSize <= 2) {
					console.warn(emitter + '.parseAudioData: invalid AAC packet, missing packetType and/or payload');
					return;
				}
				udata = new Uint8Array(buffer, dataOffset + 1, dataSize - 1);
				if (udata[0] === 1) {
					udata = udata.subarray(1);
				} else {
					udata = null;
				}
			} else {
				if (dataSize < 5) {
					console.warn(emitter + '.parseAudioData: invalid MPEG packet, header missing');
					return;
				}
				udata = new Uint8Array(buffer, dataOffset + 1, dataSize - 1);
			}
			if (udata !== null && udata.byteLength !== 0) {
				if (this.audioTrack.lastDts === null) {
					this.audioTrack.dtsOffset = tagTimestamp;
				}			
				this.audioTrack.samples.push({
					data: udata,
					length: udata.byteLength,
					dts: tagTimestamp,
					pts: tagTimestamp
				});
				this.audioTrack.length += udata.byteLength;
				this.audioTrack.lastDts = tagTimestamp;
			}
		};
		this.filterKeyFrames = function(value) {
			if (typeof value === 'boolean') {
				keyFramesOnly = value;
			}
		};
	};
	var initH265Decoder = function(h265queue, settings) {
		var thisCam = this;
		var frameMul = settings.frameMul || 1;
		if (!settings.isWorkerAvailable) {
			var fcnt = 0, imageData;
			var h265decoder = new libde265.Decoder();
			h265decoder.disable_filters(true);
			h265decoder.set_image_callback(function(image) {
				if (frameMul !== 1) {
					fcnt += 1;
				}
				var w = image.get_width(), h = image.get_height();
				if (!imageData || w != imageData.width || h != imageData.height) {
					imageData = new ImageData(w, h);
					for (var i = 0; i < w * h; i++) {
						imageData.data[i*4 + 3] = 255;
					}
					settings.onMetaData({videoWidth: w, videoHeight: h});
				}
				if (frameMul === 1 || (fcnt % frameMul) === 1) {
					image.display(imageData, function(idata) {
						image.free();
						image = null;
						settings.onImageData(idata);
					});
				}
			});
			h265queue.decode = function(buffer, endoffset, position) {
				if (!buffer && !endoffset && !position) {
					if (h265queue.samples.length == 0 || h265queue.processing) {
						return;
					}
					h265queue.processing = true;
					buffer = h265queue.samples.shift().buffer;
					endoffset = buffer.byteLength;
					position = 0;
				}
				var err, dc = h265decoder, size = 4096;
				if (endoffset !== 0) {
					if (size > endoffset) {
						size = endoffset;
					}
					err = dc.push_data(new Uint8Array(buffer, position, size));
					position += size;
					endoffset -= size;					
				} else {
					// console.warn('h265 decoder: flush');
					err = dc.flush();
				}
				if (!libde265.de265_isOK(err)) {
					console.warn('h265 decoder: error='+err);
					return;
				}
				dc.decode(function(err) {
					switch(err) {
						case libde265.DE265_ERROR_WAITING_FOR_INPUT_DATA:
							break;
						default:
							if (!libde265.de265_isOK(err)) {
								console.warn('h265 decoder: error='+err);
								return;
							}
					}
					if (!dc.has_more() && !endoffset) {
						h265queue.processing = false;
						if (h265queue.samples.length !== 0) {
							window.setTimeout(h265queue.decode, 0);
						}						
					} else {
						window.setTimeout(function() {
							h265queue.decode(buffer, endoffset, position);
						}, 0);
					}
				});
			};
		} else {
			var h265decoder = new Worker('/js/libde265.fpst.min.js');
			h265decoder.postMessage({op: 'init', disableFilters: true, frameMul: frameMul});
			h265decoder.onmessage = function(e) {
				if (typeof e.data === 'object') {
					if (typeof e.data.imageData === 'object') {
						settings.onImageData(e.data.imageData);
					} else if (typeof e.data.metaData === 'object') {
						settings.onMetaData(e.data.metaData);
					} else if (e.data.free && typeof settings.onMemoryFree === 'function') {
						settings.onMemoryFree(e.data.free);
					}
				}
			};
		}
		return h265decoder;		
	};

	var FlvDecoder = function(settings) {
		if (!settings.loader) {
			console.warn('FlvDecoder: http-loader not specified');
		}
		if (!settings.url) {
			console.warn('FlvDecoder: url not specified');
		}
		var frameMul = (settings.frameMul && settings.frameMul > 1) ? settings.frameMul : 1;
		var tail = null, flv = this, mediaSource = null, audio = null, audioGap = 0, audioEnd = 0, audioSourceBuffer = null, mp4Boxer = null;
		var isWorkerAvailable = (typeof settings.isWorkerAvailable === 'boolean') ? settings.isWorkerAvailable : (typeof Worker === 'function');
		var demuxer = new FlvDemuxer({
			onMetaData: function() {
				if (this.videoTrack.codec !== null && this.videoTrack.codec !== 'hvc1') {
						throw {message: 'unexpected codec ' + this.videoTrack.codec};
				}
				if (this.audioTrack.codec !== null && flv.mediaElement !== null) {
					audio = flv.mediaElement.getAudio();
					if (audio !== null && mediaSource === null) {
						if (('MediaSource' in window) && window.MediaSource.isTypeSupported(this.audioTrack.mimeCodec)) {
							if (this.audioTrack.codec === 'aac') {
								mp4Boxer = new Mp4Boxer();
							}
							mediaSource = new window.MediaSource();
							mediaSource.addEventListener('sourceopen', function() {
								audioSourceBuffer = mediaSource.addSourceBuffer(demuxer.audioTrack.mimeCodec);
								audioSourceBuffer.addEventListener('updateend', function() {
									syncAudioBuffer();
									if (audio.paused === true) {
										if (flv.paused === false) {
											if (audio.muted === false) {
												audio.play();
											}
										} else if (audio.buffered.length) {
											audio.currentTime = audio.buffered.end(audio.buffered.length - 1);
										}
									}
								});
								audioSourceBuffer.addEventListener('error', function(e) {
									console.warn('FlvDecoder: source buffer error (' + demuxer.audioTrack.mimeCodec + ')');
								});
								if (mp4Boxer !== null) {
									audioSourceBuffer.appendBuffer(
										mp4Boxer.meta({
											id: 1, channelCount: demuxer.audioTrack.channelCount, samplingRate: demuxer.audioTrack.samplingRate, esds: demuxer.audioTrack.esds
										})
									);
								}
							});
							mediaSource.addEventListener('sourceclose', function() {
								audioSourceBuffer = null;
								console.warn('FlvDecoder: media source has been closed');
							});
							audio.src = URL.createObjectURL(mediaSource);
						} else {
							console.warn('FlvDecoder: unsupported audio MIME type or codec', this.audioTrack.mimeCodec);
						}
					}
					if (typeof settings.onMetaData === 'function') {
						settings.onMetaData({audioCodec: this.audioTrack.codec});
					}
				}
			},
			audio: settings.hasAudio || false
		});
		var h265queue = {samples: [], processing: false};
		var h265decoder = initH265Decoder(h265queue, {
			// frame multiplicity
			frameMul: frameMul,
			onImageData: (function(imageData) {
				this.incrementBuffer();
				if (typeof settings.onImageData === 'function') {
					settings.onImageData(imageData, this.bufferedTime);
				}
				imageData = null;
			}).bind(this),
			onMetaData: (function(metaData) {
				if (this.bufferedTime === 0 && demuxer !== null) {
					this.bufferedTime = demuxer.videoTrack.dtsOffset;
				}
				if (typeof settings.onMetaData === 'function') {
					metaData.videoCodec = demuxer.videoTrack.codec;
					settings.onMetaData(metaData);
				}
			}).bind(this),
			onMemoryFree: function(time) {
				// console.log('h265decoder: memory free');
				h265decoder.terminate();
				isWorkerAvailable = false;
				if (demuxer === null) {
					h265decoder = null;
				}
			},
			isWorkerAvailable: isWorkerAvailable		
		});
		var dataLength = 0;
		var loader = settings.loader;
		loader.configure({
			source: settings.url,
			reconnect: false,
			onload: function(data) {
				if (data && data.length) {
					dataLength += data.length;
					if (tail) {
						var _data = data;
						data = new Uint8Array(tail.length + _data.length);
						data.set(tail, 0);
						data.set(_data, tail.length);
						_data = null;
						tail = null;
					}
					try {
						var consumed = demuxer.parseChunk(data.buffer, dataLength - data.length);
						if (consumed < data.length) {
							tail = consumed ? data.slice(consumed) : data;
						}
						if (consumed !== 0) {
							if (demuxer.videoTrack.samples.length !== 0) {
								demuxer.videoTrack.samples.map(function(sample) {
									h265queue.samples.push(sample.data);
									return true;
								});
								demuxer.videoTrack.samples = [];
								demuxer.videoTrack.length = 0;
								if (isWorkerAvailable) {
									h265decoder.postMessage({op: 'decode', samples: h265queue.samples});
									h265queue.samples = [];
								} else {
									window.setTimeout(h265queue.decode, 0);
								}
							}
							if (demuxer.audioTrack.samples.length !== 0) {
								window.setTimeout(syncAudioBuffer, 0);
							}
						}
					} catch (e) {
						console.warn('FlvDemuxer:', e.message);
						loader.stopLoad();
						if (e.message.indexOf('codec avc') !== -1 && typeof settings.onCodecUnsupported) {
							settings.onCodecUnsupported();
						}
					}
				}
			}
		});
		this.paused = true;
		this.bufferedTime = 0;
		this.mediaElement = null;
		this.attachMediaElement = function(element) {
			this.mediaElement = element;
			if (typeof element.play === 'function') {
				element.controller = this;
			}
		};
		this.detachMediaElement = function() {
			if (mediaSource !== null) {
				if (mediaSource.readyState !== 'closed') {
					for (var i = 0; i < mediaSource.sourceBuffers.length; i++) {
						mediaSource.removeSourceBuffer(mediaSource.sourceBuffers[i]);
					}
				}
				if (mediaSource.readyState === 'open') {
					try {
						mediaSource.endOfStream();
					} catch (error) {
						console.warn('FlvDecoder:', error.message);
					}
				}
				if (audio !== null) {
					URL.revokeObjectURL(audio.src);
					audio.src = '';
					audio.removeAttribute('src');
					audioEnd = 0;
					audioSourceBuffer = null;
				}
				mediaSource = null;
			}
			if (mp4Boxer !== null) {
				mp4Boxer = null;
			}
			if (this.mediaElement !== null) {
				this.mediaElement.controller = null;
				this.mediaElement = null;
			}
		};
		this.load = function() {
			loader.startLoad();
		};
		this.unload = function() {
			loader.stopLoad();
			if (isWorkerAvailable) {
				h265decoder.postMessage({op: 'free'});
			} else {
				h265decoder.free();
			}
		};
		this.destroy = function() {
			this.bufferedTime = 0;
			this.detachMediaElement();
			loader = null;
			demuxer = null;
			if (!isWorkerAvailable) {
				h265decoder = null;
			}
		};
		this.play =	function() {
			this.paused = false;
			if (this.mediaElement !== null && this.mediaElement.paused === true) {
				this.mediaElement.paused = false;
			}
		};
		this.pause = function() {
			this.paused = true;
			if (this.mediaElement !== null && this.mediaElement.paused === false) {
				this.mediaElement.paused = true;
			}
		};
		this.incrementBuffer = function() {
			if (demuxer !== null) {
				this.bufferedTime += demuxer.videoTrack.framePeriod * frameMul;
				if (demuxer.audioTrack.length !== 0) {
					if (audio !== null && audio.paused === false && audio.buffered.length) {
						audioGap = (audio.buffered.end(audio.buffered.length - 1) - audio.currentTime) * 1000;
					} else {
						audioGap = 0;
					}
					if (audioGap > 500) {
						audio.currentTime = audioGap < 1000 ? audio.currentTime : audio.buffered.end(0);
					}
					window.setTimeout(function() {
						syncAudioBuffer(flv.bufferedTime + demuxer.videoTrack.framePeriod * (1 - frameMul) + audioGap);
					}, 0);
				}
			}
		};
		this.filterKeyFrames = function(value) {
			if (demuxer !== null) {
				demuxer.filterKeyFrames(value);
			}
		};
		this.getBytesReceieved = function() {
			return dataLength;
		};
		function syncAudioBuffer(pts) {
			if (pts > audioEnd) {
				audioEnd = pts;
			}
			if (audioSourceBuffer !== null && !audioSourceBuffer.updating && demuxer.audioTrack.length !== 0 && audioEnd !== 0) {
				var alength = 0, audioEndDts = audioEnd + demuxer.audioTrack.dtsOffset, imax = demuxer.audioTrack.samples.length - 1, imin = 0;
				var adata = new Uint8Array(demuxer.audioTrack.length);
				var samples = [], firstDts = null;
				for (var i = 0; i <= imax; i++) {
					if (demuxer.audioTrack.samples[i].pts <= audioEndDts) {
						adata.set(demuxer.audioTrack.samples[i].data, alength);
						alength += demuxer.audioTrack.samples[i].length;
						imin = i;
						samples.push({
							length: demuxer.audioTrack.samples[i].length,
							duration: (typeof demuxer.audioTrack.samples[i+1] !== 'undefined') ? (demuxer.audioTrack.samples[i+1].dts - demuxer.audioTrack.samples[i].dts) : demuxer.audioTrack.framePeriod,
							flags: {
								isLeading: 0,
								dependsOn: 2,
								isDependedOn: 0,
								hasRedundancy: 0,
								isNonSync: 0
							}
						});
						if (firstDts === null) {
							firstDts = demuxer.audioTrack.samples[i].dts - demuxer.audioTrack.dtsOffset;
						}
					} else {
						break;
					}
				}
				if (alength !== 0) {
					demuxer.audioTrack.length -= alength;
					demuxer.audioTrack.samples.splice(0, imin + 1);
					adata = adata.slice(0, alength);
					if (demuxer.audioTrack.codec === 'aac') {
						demuxer.audioTrack.seqNum += 1;
						var moof = mp4Boxer.moof({
							id: 1,
							seqNum: demuxer.audioTrack.seqNum,
							samples: samples
						}, firstDts);
						var mdat = mp4Boxer.mdat(adata);
						adata = new Uint8Array(moof.byteLength + mdat.byteLength);
						adata.set(moof, 0);
						adata.set(mdat, moof.byteLength);
						moof = mdat = null;
					}
					// console.log('fill audio buffer');
					audioSourceBuffer.appendBuffer(adata);
				} else if (audioSourceBuffer.buffered.length && (audioSourceBuffer.buffered.end(audioSourceBuffer.buffered.length - 1) - audioSourceBuffer.buffered.start(audioSourceBuffer.buffered.length - 1)) > 10) {
					// console.log('clean audio buffer');
					mediaSource.sourceBuffers[0].remove(audioSourceBuffer.buffered.start(audioSourceBuffer.buffered.length - 1), audioSourceBuffer.buffered.end(audioSourceBuffer.buffered.length - 1) - 5);
				}
			}
		};
	};

	if (typeof ref === 'string') {
		var refObj = eval('window.' + ref);
		if (typeof refObj === 'object') {
			Object.defineProperty(refObj, 'FlvDecoder', {value: FlvDecoder});
		}
	}
})('jFpst.utils');
