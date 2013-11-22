require 'ffi'

module CanDriver
  extend FFI::Library

  ffi_lib :CanDriver

  attach_function :IsoTpHandlerInit, [], :void
  attach_function :IsoTpHandlerStartTransmission, [:uchar, :pointer, :ushort], :void
  attach_function :IsoTpHandlerForceTransmission, [], :void
  attach_function :EsrDiagReceptionPoller, [:pointer, :pointer, :pointer, :pointer], :uchar;

  def self.init
    CanDriver.IsoTpHandlerInit
  end

  def self.send(target, bytes)
    txbuf = FFI::MemoryPointer.new(:uchar, bytes.size)
    bytes.each_with_index do |b, i|
      txbuf.put_uchar(i, b)
    end
    puts bytes.inspect
    CanDriver.IsoTpHandlerStartTransmission(target, txbuf, bytes.size)
    CanDriver.IsoTpHandlerForceTransmission
    CanDriver.IsoTpHandlerForceTransmission
  end

  def self.receive
    rxbuf = FFI::MemoryPointer.new(:uchar, 1024)
    rxlen = FFI::MemoryPointer.new(:ulong)
    canid = FFI::MemoryPointer.new(:ulong)
    target = FFI::MemoryPointer.new(:uchar)
    res = CanDriver.EsrDiagReceptionPoller(canid, rxbuf, rxlen, target)
    puts [res, rxlen.get_ulong(0)].inspect
    outbytes = (0..rxlen.get_ulong(0)-1).collect{|i| rxbuf.get_uchar(i)}
    puts "outbytes: " + outbytes.collect{|i| i.to_s(16)}.inspect
    puts "sender can id: #{canid.get_ulong(0).to_s(16)}"
    puts "target address: #{target.get_uchar(0).to_s(16)}"
    outbytes
  end
end

