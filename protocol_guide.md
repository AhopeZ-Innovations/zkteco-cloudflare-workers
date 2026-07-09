# ZKSoftware Communication Protocol Manual — Complete Reference

> Full transcription of *ZKSoftware Inc. — Communication Protocol Manual* (2006‑12‑1), reorganized into Markdown with headings/tables for readability. All commands, structures, and explanatory text from the source document are included — nothing summarized away. A practical **"How to enroll a fingerprint"** walkthrough is added at the end (§9).

---

## 1. Data Communication Packet Header Structure

```c
typedef struct _CmdHdr_ {
    Unsigned short Command, CheckSum, SessionID, ReplyID;
} TCmdHeader, *PCmdHeader;
```

**Explanation:**

- **Command**: order word
- **CheckSum**: check sum and (including packet header and data)
- **SessionID**: session number
- **ReplyID**: Reply number

**Data packet structure:** packet header + the data want to be transmitted; the machine response data packet is same with this packet of structure. Also, the order character (2 Bytes) + the check sum (2 Bytes) + the session number (2 Bytes) + the response number (2 Bytes) + the data (certain length) compose a packet to transmit and receive. Packet to Transmit and receive packet are symmetry.

### The define of command character

| Command | Value | Describe |
|---|---|---|
| CMD_CONNECT | 1000 | Connections requests |
| CMD_EXIT | 1001 | Disconnection requests |
| CMD_ENABLEDEVICE | 1002 | Ensure the machine to be at the normal work condition |
| CMD_DISABLEDEVICE | 1003 | Make the machine to be at the shut-down condition, generally demonstrates 'in the work ...' on LCD |
| CMD_RESTART | 1004 | Restart the machine. |
| CMD_POWEROFF | 1005 | Shut-down power source |
| CMD_SLEEP | 1006 | Ensure the machine to be at the idle state. |
| CMD_RESUME | 1007 | Awakens the sleep machine (temporarily not to support) |
| CMD_CAPTUREFINGER | 1009 | Captures fingerprints picture |
| CMD_TEST_TEMP | 1011 | Test some fingerprint exists or does not |
| CMD_CAPTUREIMAGE | 1012 | Capture the entire image |
| CMD_REFRESHDATA | 1013 | Refresh the machine interior data |
| CMD_REFRESHOPTION | 1014 | Refresh the configuration parameter |
| CMD_TESTVOICE | 1017 | Play voice |
| CMD_GET_VERSION | 1100 | Obtain the firmware edition |
| CMD_CHANGE_SPEED | 1101 | Change transmission speed |
| CMD_AUTH | 1102 | Connections authorizations |
| CMD_PREPARE_DATA | 1500 | Prepares to transmit the data |
| CMD_DATA | 1501 | Transmit a data packet |
| CMD_FREE_DATA | 1502 | Clear machines opened buffer |
| CMD_DB_RRQ | 7 | Read in some kind of data from the machine |
| CMD_USER_WRQ | 8 | Upload the user information (from PC to terminal). |
| CMD_USERTEMP_RRQ | 9 | Read some fingerprint template or some kind of data entirely |
| CMD_USERTEMP_WRQ | 10 | Upload some fingerprint template |
| CMD_OPTIONS_RRQ | 11 | Read in the machine some configuration parameter |
| CMD_OPTIONS_WRQ | 12 | Set machines configuration parameter |
| CMD_ATTLOG_RRQ | 13 | Read all attendance record |
| CMD_CLEAR_DATA | 14 | Clear data |
| CMD_CLEAR_ATTLOG | 15 | Clear attendance records |
| CMD_DELETE_USER | 18 | Delete some user |
| CMD_DELETE_USERTEMP | 19 | Delete some fingerprint template |
| CMD_CLEAR_ADMIN | 20 | Cancel the manager |
| CMD_USERGRP_RRQ | 21 | Read the user grouping. |
| CMD_USERGRP_WRQ | 22 | Set users grouping |
| CMD_USERTZ_RRQ | 23 | Read the user Time Zone set |
| CMD_USERTZ_WRQ | 24 | Write the user Time Zone set |
| CMD_GRPTZ_RRQ | 25 | Read the group Time Zone set |
| CMD_GRPTZ_WRQ | 26 | Write the group Time Zone set |
| CMD_TZ_RRQ | 27 | Read Time Zone set |
| CMD_TZ_WRQ | 28 | Write the Time Zone |
| CMD_ULG_RRQ | 29 | Read unlocks combination |
| CMD_ULG_WRQ | 30 | write unlocks combination |
| CMD_UNLOCK | 31 | unlock |
| CMD_CLEAR_ACC | 32 | Restores Access Control set to the default condition. |
| CMD_CLEAR_OPLOG | 33 | Delete attendance machines all attendance record. |
| CMD_OPLOG_RRQ | 34 | Read manages the record |
| CMD_GET_FREE_SIZES | 50 | Obtain machines condition, like user recording number and so on |
| CMD_ENABLE_CLOCK | 57 | Ensure the machine to be at the normal work condition. |
| CMD_STARTVERIFY | 60 | Ensure the machine to be at the authentication condition |
| CMD_STARTENROLL | 61 | Start to enroll some user, ensure the machine to be at the registration user condition |
| CMD_CANCELCAPTURE | 62 | Make the machine to be at the waiting order status, please refers to the CMD_STARTENROLL description. |
| CMD_STATE_RRQ | 64 | Gain the machine the condition |
| CMD_WRITE_LCD | 66 | Write LCD |
| CMD_CLEAR_LCD | 67 | Clear the LCD captions (clear screen). |
| CMD_GET_PINWIDTH | 69 | Obtain the length of user's serial number |
| CMD_SMS_WRQ | 70 | Upload the short message. |
| CMD_SMS_RRQ | 71 | Download the short message |
| CMD_DELETE_SMS | 72 | Delete the short message |
| CMD_UDATA_WRQ | 73 | Set user's short message |
| CMD_DELETE_UDATA | 74 | Delete user's short message |
| CMD_DOORSTATE_RRQ | 75 | Obtain the door condition |
| CMD_WRITE_MIFARE | 76 | Write the Mifare card |
| CMD_EMPTY_MIFARE | 78 | Clear the Mifare card |
| CMD_GET_TIME | 201 | Obtain the machine time |
| CMD_SET_TIME | 202 | Set machines time |
| CMD_REG_EVENT | 500 | Register the event |

**Real-time event flags:**

| Event | Value | Describe |
|---|---|---|
| EF_ATTLOG | 1 | Be real-time to verify successfully |
| EF_FINGER | (1<<1) | be real–time to press fingerprint (be real time to return data type sign) |
| EF_ENROLLUSER | (1<<2) | Be real-time to enroll user |
| EF_ENROLLFINGER | (1<<3) | be real-time to enroll fingerprint |
| EF_BUTTON | (1<<4) | be real-time to press button |
| EF_UNLOCK | (1<<5) | be real-time to unlock |
| EF_VERIFY | (1<<7) | be real-time to verify fingerprint |
| EF_FPFTR | (1<<8) | be real-time capture fingerprint minutia |
| EF_ALARM | (1<<9) | Alarm signal |

**Machine return orders (ACK codes):**

| Code | Value | Describe |
|---|---|---|
| CMD_ACK_OK | 2000 | Return value for order perform successfully |
| CMD_ACK_ERROR | 2001 | Return value for order perform failed |
| CMD_ACK_DATA | 2002 | Return data |
| CMD_ACK_RETRY | 2003 | /* Registered event occurred */ |
| CMD_ACK_REPEAT | 2004 | — |
| CMD_ACK_UNAUTH | 2005 | Connection unauthorized |
| CMD_ACK_UNKNOWN | 0xffff | Unknown order |
| CMD_ACK_ERROR_CMD | 0xfffd | Order false |
| CMD_ACK_ERROR_INIT | 0xfffc | /* Not Initializated */ |
| CMD_ACK_ERROR_DATA | 0xfffb | — |

**Data type signs (attendance record, fingerprint):**

| Tag | Value | Describe |
|---|---|---|
| FCT_ATTLOG | (U8)1 | Attendance record |
| FCT_WORKCODE | (U8)8 | WorkCode |
| FCT_FINGERTMP | (U8)2 | Fingerprint data |
| FCT_OPLOG | (U8)4 | Operation record |
| FCT_USER | (U8)5 | User record |
| FCT_SMS | (U8)6 | Short message |
| FCT_UDATA | (U8)7 | User's short message |

---

## 2. The Description and Detailed Explanation to the Order Characters

**CMD_CONNECT.** This order is applied to connect the machine, if succeed, then follow the structure of the packet header from CMD_ACK_OK to return order, closed follow a packet of structure to transmit each data it, packet header detailed meaning description:

- **Verification and (CheckSum) algorithm:** According to unsigned short integer accumulate the entire packet, till over 2147483648 (long 4 bytes), gains the low 2 byte values continue to add together again, depending on the position that the value is obtained to get one's complement, and transform it into the short integer (unsigned short 2 bytes), namely obtains the verification sum.
- **Session number (SessionID):** Uniquely sign a time of connection, returns and assigned by the machine when machine executes connection.
- **Order response number (ReplyID):** The only mark current transmission order, is an accumulation value, uses in to differentiate the order, namely starts from the connection, each ReplyID order is different. If the machine has established the connection password, then carries out successfully after the connection, the machine return the authorized order that has not connected. Needs to transmit the connection password once more, can complete the connection process, please refer the authorized order to connect.

**CMD_EXIT** — Disconnect

**CMD_ENABLEDEVICE** — Ensure the machine to be at in the normal work condition, generally when data communication shields the machine auxiliary equipment (keyboard, LCD, sensor), this order restores the auxiliary equipment to be at the normal work condition.

**CMD_DISABLEDEVICE** — Shield machine periphery keyboard, LCD, sensor, if perform successfully, there are showing 'in the work …'. on LCD.

**CMD_CAPTUREFINGER\CMD_CAPTUREFINGER** — Capture image data from a machine sensor. ZEM200 (A5, F4+ and so on) series product do not support this function. Response data is bitmap originality ranks data, because the data to be transmitted is too big when capture bitmap, the terminal first transmits a special packet, the first 4 bytes of this packet data part to save must accept the total length of the data, then the size of each packet will be saved as 4 bytes, certainly, last the packet is possibly smaller or equal to the size of the packet, also each packet cannot over 1Kbytes. When read in some bigger data, like all fingerprints template, attendance records, general add a sign in the packet of data part to indicate the data type that to be read. If capture the non-complete picture, the data part first 4 bytes of the packet is 500 (the capture partial image (small image)). If capture picture which size is defined by itself, then the data part start to fill in 4 bytes widths values from the first idle byte, because the proportion of the picture is defined, therefore high does not need to be transmitted. The order to transmit the big image has been sent, the size to receive the data (no header) should be 640*480, otherwise, the data part 1-4 byte save bitmap the DPI, 5-8 byte save bitmap width, 8-12 byte save bitmap altitude.

**CMD_TEST_TEMP** — Examine some fingerprint template exist or does not, the data part transmits some fingerprint template, if the fingerprint existence, returns the order character CMD_ACK_OK. The data part returns to the user serial number. The byte count of the serial number is decided by the user serial number byte which the machine can support.

**CMD_REFRESHDATA** — Refresh the data in the machine, mainly complete to synch the data, refresh the fingerprint library and so on, and generally upload the mass datum after executing this order.

**CMD_REFRESHOPTION** — Refresh the machine configuration, inform the firmware to reconfigure. Like as the machine serial number, baud rate, time and so on.

**CMD_TESTVOICE** — Play voice. May according to the pronunciation address and the length to play voice (only supports ZEM100, because ZEM100 uses pronunciation chip), the first two bytes of data part of the transmission packet separately transmit the address and the length. Also may use the index to play voice which is fixed pronunciation.

**CMD_CHANGE_SPEED** — Change speed to the machine transmission data. Transmit 0, indicated the slowdown, transmit 1, indicated the increasing speed.

**CMD_AUTH** — Authorized connection. If the machine has established the signal code, when go on connecting.

**CMD_PREPARE_DATA** — Inform the machine prepare for transmission data (for example PC-> Device), or machine prepare for to receive data (Device-> PC). Fill the length of data which want to be transmitted in this packet of data part first 4 bytes. After the machine receives this order, can according to session number to create a buffer which use to receive the data which has been transmitted, after executing this order successfully, may use the CMD_DATA to transmit data, be sure to transmit data success, transmit the order CMD_FREE_DATA to tell the machine the data is complete, and release the buffer space to open. This process general apply to restore the firmware upgrade the data and so on in the big data communication, certainly, inform machine this data to play any role after the transmission finish, temporarily it is no in the nude.

**CMD_DB_RRQ** — Read some saved data complete in the machine interior, the data is transmitted by the firmware definition structure, for more detail of the structure please refer to the firmware structure of data definition, the mode to transmit data follow the rule the mass data is to be transmitted, please refer to the order description for capturing fingerprint bitmap. The request to transmit data is decided by the first byte of the packet's data part. If the first byte is saved as the sign of the attendance data, then read all attendance record.

> Note: always read the big data order all to follow above the way, like attendance record, user, and fingerprint. Other read the big data order will be no longer to relate in detail.

**CMD_USER_WRQ** — Upload the user information; the uploading order not only the transmit oversized data but also upload the user information, and the fingerprint template, Access Control privilege and so on, fill the data part of packet depending on the structure of data. After the data transmitting finish, according to the performed result the machine return to the data.

**CMD_USERTEMP_RRQ** — This order may read some user's fingerprint data, assign the user serial number (2 Bytes) and the fingerprint index (0-9) to the data part of the transmission packet; The data part assigns a byte data type, then read in some kind of specific data.

**CMD_USERTEMP_WRQ** — Upload some user fingerprint template, the transmission packet of data part structure please refers to the firmware structure of data.

> Note: the precondition to successfully upload the fingerprint template which is, the user must exist, the user, whose the fingerprint will be uploaded, must be empty.

**CMD_OPTIONS_RRQ** — Read in some configuration parameter value in the machine. Need to fill a configuration name the data part of the data packet, carries out successfully, return to this configuration value.

**CMD_OPTIONS_WRQ** — Set configuration parameter to the machine. The data packet data part needs to fill a configuration name.

**CMD_ATTLOG_RRQ** — Read all attendance record (please refer to the relative description to read big data), this order function is alone; only apply to read the attendance record.

**CMD_CLEAR_DATA** — Clear some kind of data, if do not assign the data type, then deletes all data, otherwise depending on the assigned type to delete data.

**CMD_CLEAR_ATTLOG** — Delete attendance record.

**CMD_DELETE_USER** — Delete some user. Fill data part of the transmission packet with user serial number (2 Bytes).

**CMD_DELETE_USERTEMP** — Delete user's some fingerprint template. Fill 1-2nd byte the data part of transmission packet with user serial number (2 Bytes), fill 3rd byte with fingerprint serial number (0-9).

**CMD_CLEAR_ADMIN** — Delete the manager.

**CMD_USERGRP_RRQ** — Read the user group. Apply to ZK Access Control machine (F4, F4+, A6 and so on) operation. Fill the first two bytes of data part of the transmission packet with user serial number (2 Bytes).

**CMD_USERGRP_WRQ** — Set user group. Fill the 1-4 byte of data part of the transmission packet with user serial number (2 Bytes), 5-8 byte with the group serial number.

**CMD_USERTZ_RRQ** — Read the user employed Time Zone. Fill 2 bytes of the transmission packet data part with user's serial number (2 Bytes). The returned 1-4 byte data is the user serial number; 12 bytes respectively indicate 3 Time Zone serial numbers which used by the user behind the date, each serial number takes 4 bytes.

**CMD_USERTZ_WRQ** — Set user used Time Zone. Fill 1-4 byte of data part transmission packet with used the Time Zone quantity, at present only can set 3 Time Zone, and therefore fills in the value 3. Behind it 12 bytes separately fill 3 Time Zone serial numbers, each take 3 bytes.

**CMD_GRPTZ_RRQ** — Read the group Time Zone. Please refer to read the user Time Zone, the function is same. The order to set group Time Zone and user Time Zone function is similar as, no longer describes it.

**CMD_TZ_RRQ\ CMD_TZ_WRQ** — Read Time Zone setting. Fill the first 4 bytes of data part of the transmission packet with Time Zone serial number. Access Control machine support 50 time groups is available. Each Time Zone cycle is the week, in the week the setting form of the daily Time Zone is 24 hours format, for example: 09.091616 is some day Time Zone setting, meaning also, this day 08:08 starts to 16:16 for this day effective Time Zone. The entire Time Zone take the week as a unit, which according to every day Time Zone to arrange. The Time Zone arrangement starts from Sunday.

**CMD_ULG_RRQ\CMD_ULG_WRQ** — Read the group unlocking combine. The return is the sequence numeral, namely group combination setting. Access Control machine can support 5 groups, 10 unlocking combination at present. The combination return is separated by ':'. The writhing combination also is separated by ':'. Fill data part of transmission or receiving packet with combination information.

**CMD_UNLOCK** — Unlock order. Inform the Access Control machine to unlock, Set the first 4 bytes of data part the transmission packet as duration of delay unlocking.

**CMD_GET_FREE_SIZES** — No (description not further specified in the source manual).

**CMD_ENABLE_CLOCK** — Set the LCD dot (to glitter ':') the packet data part transmit 0 to stop glittering, 1 start to glitter. After this order carries out successfully, the firmware will refresh LCD.

**CMD_STARTVERIFY** — Ensure the machine to be at the verification state. If the transmission packet has been filled with user serial number (2 Bytes), then start to verify this user, machine prompt user to press fingerprint. If has not transmitted the user serial number, then machine auto-restore to normal verification condition.

**CMD_STARTENROLL** — Causes the machine to be at the registration state, fill data part 1-2 byte of the transmission packet with user serial number (2 Bytes), 3-4 byte is applied to fill fingerprint serial number, after executing successful LCD prompt user to press fingerprint, start registration.

> Note: in the setting before the starting registration, cannot enter the registration until transmit the CMD_CANCELCAPTURE order, after registers, may use the CMD_STARTVERIFY order to restore to the normal verification condition.

**CMD_STATE_RRQ** — No (description not further specified in the source manual).

**CMD_WRITE_LCD** — This order transmit character to demonstrate on LCD, the data part 1, 2 bytes of the packet transmit the rank value which start to demonstrate, the 3rd byte setting is 0, follows close the filling character which want to be transmit. May work in CMD_CLEAR_LCD when use this function.

**CMD_GET_PINWIDTH** — Obtain the length of user serial number, general the serial number is 5 or above.

**CMD_SMS_WRQ** — Upload the short message. Depending on the short message structure the data packet will be filled, please the reference data structure descriptions.

**CMD_SMS_RRQ** — Download the short message. Fill the first 2 bytes of data part of transmission packet with download the short message serial number. The return part of the data packet is returned by the short message structure.

> Note: The short message function only can support the machine which is allowed to support short message this order (for example A6).

**CMD_DELETE_SMS** — Delete some short message. Fill the data part of transmission packet with 2 byte short message serial number.

**CMD_UDATA_WRQ** — Set user short message. Depending on the user short message structure fill data part of the transmission packet.

**CMD_DELETE_UDATA** — Delete user some short message. According to the short message structure the data part of transmission packet will be filled with the user short message data want to be deleted.

**CMD_DOORSTATE_RRQ** — Obtain the door condition (no further description provided in the source manual).

**CMD_WRITE_MIFARE** — Inform machine to write Mifare card. Only the machine with Mifare card reader is able to support this function. Fill the data part 1-4 byte of the transmission packet with user serial number, and 12 bytes with templates information, the first 3 bytes of these 12 bytes, fill the 1-2nd byte with template length, and the 3rd byte with template index (corresponding user some fingerprint), for this 12 bytes, the first 1-3 byte cannot be empty, there must be template in these bytes. May write 4 fingerprints templates, the following 9 bytes separately is filled with other three fingerprints length and the index, to fill every three bytes methods is same with before filling 3 bytes packing. May refer to the following structure:

```
4th Byte | [1-2 bytes (fingerprint 1 template length), 3rd byte (fingerprint index)],
         | [4-6...] | The user numbers 4 bytes | fingerprints templates information 12 bytes | 1-4 fingerprint template data
```

**CMD_GET_TIME** — Get the time of the machine. Fill the data part 4 bytes of the return packet with the time setting, time value is customize code, its encoding method as follows:

```
((Year%100) * 12 * 31 + ((month-1) * 31) + day - 1) * (24*60*60) + (hour*60 + minutes) * 60 + second
```

according to this encoding method to decode.

**CMD_REG_EVENT** — Register the real-time event. If has registered this event, the machine meets transmit the real-time data to the connection, like when the user verification is successful, or keep hold the keyboard, the machine transmits these information to all connections (success connection).

---

## 3. Data Structures

Data organization has definition in the data structure to transmit and receive data packet, in the definition the data structure is quite same with the firmware's one, please refer as follows.

### The user data structure

Before the 5.04 edition firmware, have to use the following data structure, it uniform by 1 byte.

```c
typedef struct _UserOld_ {
    U16  PIN;
    U8   Privillege;    // privilege, 0=Common user, 1=Enroller, 2=Manager, 3=Super administrator
    char Password[5];
    char Name[8];
} TUserOld, *PUserOld;
```

After the 5.04 edition firmware, the user data structure as follow, it uniform by 1 byte.

```c
typedef struct _User_ {
    U16  PIN;          // user's serial number to the machine interior.
    U8   Privillege;   // such as following illustrating, regard the 0-7 bit, if the 3-1
                        // bit 000, Common user; 001, Enroller; 110, manager; 111, super manager.
                        // the last bit of the Privilege is 0 which means in effect, 1, invalid.
    // 7 6 5 4 3 2 1 0
    // 0 0 0 0 0 0 1 0
    char Password[5];  // Password
    char Name[8];       // User Name
    U8   Card[5];        // Card number, be apply to save the corresponding ID Card No.
    U8   Group;           // user respective group
    U16  TimeZones;       // user may use time Zone, bit sign.
    U32  PIN2;             // 32 Bit user second identification number
} TUser, *PUser;
```

> Note: Before 5.04 editions, the machine only supports 5 codes, in order to support the more Bit user code, after 5.04 editions has defined the new user data structure, which uses 4 bytes to indicate the user serial number. Namely afterwards 9 bit codes machine. When go on communication, before in the very many places there are prompt that user serial number transmits two bytes, which is U16 PIN. Other places stated U16 PIN is all same.

### The data structure of fingerprint template

```c
typedef struct _Template_ {
    U16  Size;        // the length of fingerprint template
    U16  PIN;          // corresponds with the user data structure PIN
    char FingerID;      // fingerprint
    char Valid;           // fingerprint is valid or invalid
    char *Template;        // fingerprint template
} TTemplate, *PTemplate;
```

### Attendance record structure

The follow is the attendance record data structure of the non-extension record, namely the attendance record use the compression form to store up.

```c
typedef struct _AttLog_ {
    Int  PIN;          // U16 PIN, user serial number
    char verified;      // matching way
    time_t time_second;  // time, time encoding is customized time encoding.
    char status;          // attendance condition
} TAttLog, *PAttLog;
```

> Note: The read order only can be apply to the attendance record, read in all attendance records. The compression format of the attendance record is divided into the length or short mode, its compressing way are follow (for example presently read in char *Buffer, the pointer is in the first byte): The first 2 bytes are used to save user serial number (U16 PIN), third byte first three (Bit) saves the state to match, the 4-5th save the way to match, 6th bit is used to save the indicator which tell how long time is; If it is a short time form, then the time value lastly two bit of the third byte and follow byte save the time excursion value, the attendance record time is the time excursion value to add the time datum value, the datum time value is recently a long time value (therefore long mode save integrity time, the short time form saved time excursion value add the time datum value), then, might according to the time encoding way (be possible to refer customize encoding method), to obtain the correct time.

Follow is a extension attendance data record structure:

```c
typedef struct _ExtendAttLog_ {
    U32    PIN;
    time_t time_second;  // here is integrity time
    BYTE   status;
    BYTE   verified;
    BYTE   reserved[2];   // temporarily is useless.
    U32    workcode;
} TExtendAttLog, *PExtendAttLog;
```

If the data storage form is the extension, then defers to this structure to read the attendance record.

### Short message data structure

```c
typedef struct _SMS_ {
    U8  Tag;                                 // category, public short message, non-public short message.
    U16 ID;                                   // data content marked 0 to express the record already invalid
    U16 ValidMinutes;                          // effective minute, 0 = permanent.
    U16 Reserved;
    U32 StartTime;                              // Start time
    U8  Content[MAX_SMS_CONTENT_SIZE+1];         // short message content, MAX_SMS_CONTENT_SIZE=60
} TSms, *PSms;
```

**User short message data structure:**

```c
typedef struct _UData_ {
    U16 PIN;      // 0 express invalid records.
    U16 SMSID;     // short message serial number.
} TUData, *PUData;
```

### Management data record structure

```c
typedef struct _OPLog_ {
    U16    Admin;        // manager NUMBERS
    BYTE   OP;             // operation type
    time_t time_second;     // time, complete time. May according to customized the definition method to decode
    U16    Users[4];          // User[0], the user serial number which is operated
                                // Users[1], the operating result, the success is 1, the defeat is 0.
                                // Users[2], Users[3] is useless
} TOPLog, *POPLog;
```

**Operation type description as follows:**

| Value | Describes |
|---|---|
| 0 | Turn on machine |
| 1 | Turn off machine |
| 2 | Failed to authentication warn |
| 3 | Anti-dismantle warn |
| 4 | Enter menu |
| 5 | Change Option |
| 6 | Backup to enroll fingerprint |
| 7 | Add Password |
| 8 | To register the HID card |
| 9 | Delete User |
| 10 | Delete fingerprint |
| 11 | Delete Password |
| 12 | Delete RF Card |
| 13 | Clean data |
| 14 | Create MF Card |
| 15 | Enroll MF Card |
| 16 | Register MF Card |
| 17 | Delete MF card registered |
| 18 | Clean MF Card content |
| 19 | Transfer the registration data into the card |
| 20 | Copy data in the card to the standalone fingerprint machine |
| 21 | Set the time of the Standalone fingerprint machine |
| 22 | Restore the leaving-factory option |
| 23 | Clean attendance (check-in, out) record |
| 24 | Clean administrator privilege |
| 25 | Revise Access Control option |
| 26 | Revise User Access Control option |
| 27 | Revise Time Zone of Access Control option |
| 28 | Revise Unlock Combin |
| 29 | Unlock |
| 30 | Enroll User |

---

## 4. Real-Time Events

After registers the event in the machine, the machine is able to transmit the relative real-time information to the connection, when receive the CMD_REG_EVENT order which the machine transmits, namely receives the real-time data, may according to the different data type to take analysis of the related information. In this packet this SessionID indicate event type, please refer as follows, fill and save in data part of the received packet with relative information, and after receives the real-time message, the session ID will change. Needs to reply the successful order.

**EF_ATTLOG** — Data part of the excursion meaning as follows: 1-2nd byte: User serial number; 4th byte high 4bit: Whether effective, low 4bit: attendance state; 3rd byte: matching way; The following 6 bytes are: When year, month and day minutes and seconds. Its middle-value is based on 2000.

**EF_ENROLLUSER** — After register some user successfully, the machine returns this real-time data. The data part of the receive packet may obtain two bytes of the users serial number.

**EF_ENROLLFINGER** — (no further description provided in the source manual).

**EF_BUTTON** — Data part returns value of the keyboard that is pressed.

**EF_VERIFY** — Data part returns the user serial number.

**EF_FPFTR** — Data part returns score when perform the matching fingerprint.

**EF_ALARM** — The length of the data part to be returned is 4, the first byte is 55: anti-dismantle alarm; The first byte is 53: release button. Length of the data part to be returned is 8, the first byte is 54: close door; Length the data part to be returned is 12, the first two bytes are 0xFFFF: duress alarm, 7, 8 bytes is the alarm type. 5, 6 bytes is the duress fingerprint serial number. 9-12 byte is the matching way.

---

## 5. Communication Way

**UDP** — There is a UDP Server to monitor 4,370 ports in the machine, ability to transmit or receive the data via UDP protocol, the data in the machine is comparatively few, read in the greatest information content is the fingerprint template, the fingerprint template generally is more than 600 bytes.

**RS232\485** — Passable RS232\485 communication.

**Other** — in some machines, there is a built-in WebServer, may through the Http request to communicate. Next, some machines may support the SOAP communication interface, may use the SOAP protocol to communicate. The different machine possibly support the different function, only supplies the reference.

---

## 6. Time Encoding Formula (reference)

```
value = ((Year % 100) * 12 * 31 + (Month - 1) * 31 + (Day - 1)) * 86400
        + (Hour * 60 + Minute) * 60 + Second
```

Used by `CMD_GET_TIME` and to decode attendance-record timestamps.

---

## 7. Bulk Transfer Pattern (reference)

1. Size-announcement packet: first 4 data bytes = total length of data to follow.
2. Chunked data packets, each ≤ 1 KB.
3. For generic reads (`CMD_DB_RRQ`), the leading data byte(s) indicate the `FCT_*` type being read.
4. For uploads: `CMD_PREPARE_DATA` (length in first 4 bytes) → one or more `CMD_DATA` packets → `CMD_FREE_DATA`.

---

## 8. Quick Command Lookup by Category

| Category | Commands |
|---|---|
| Connection/session | CMD_CONNECT, CMD_EXIT, CMD_AUTH, CMD_CHANGE_SPEED |
| Device power/state | CMD_RESTART, CMD_POWEROFF, CMD_SLEEP, CMD_RESUME, CMD_ENABLEDEVICE, CMD_DISABLEDEVICE, CMD_STATE_RRQ, CMD_GET_VERSION, CMD_GET_TIME, CMD_SET_TIME, CMD_GET_FREE_SIZES, CMD_GET_PINWIDTH |
| Fingerprint capture/verify | CMD_CAPTUREFINGER, CMD_CAPTUREIMAGE, CMD_TEST_TEMP, CMD_STARTVERIFY, CMD_STARTENROLL, CMD_CANCELCAPTURE |
| Bulk transfer plumbing | CMD_PREPARE_DATA, CMD_DATA, CMD_FREE_DATA, CMD_REFRESHDATA, CMD_REFRESHOPTION, CMD_DB_RRQ |
| Users/templates | CMD_USER_WRQ, CMD_USERTEMP_RRQ, CMD_USERTEMP_WRQ, CMD_DELETE_USER, CMD_DELETE_USERTEMP, CMD_CLEAR_DATA, CMD_CLEAR_ADMIN |
| Attendance/logs | CMD_ATTLOG_RRQ, CMD_CLEAR_ATTLOG, CMD_CLEAR_OPLOG, CMD_OPLOG_RRQ |
| Groups/time zones/access | CMD_USERGRP_RRQ/WRQ, CMD_USERTZ_RRQ/WRQ, CMD_GRPTZ_RRQ/WRQ, CMD_TZ_RRQ/WRQ, CMD_ULG_RRQ/WRQ, CMD_UNLOCK, CMD_CLEAR_ACC, CMD_DOORSTATE_RRQ |
| Options/UI | CMD_OPTIONS_RRQ/WRQ, CMD_WRITE_LCD, CMD_CLEAR_LCD, CMD_TESTVOICE, CMD_ENABLE_CLOCK |
| SMS/Mifare | CMD_SMS_WRQ/RRQ, CMD_DELETE_SMS, CMD_UDATA_WRQ, CMD_DELETE_UDATA, CMD_WRITE_MIFARE, CMD_EMPTY_MIFARE |
| Events | CMD_REG_EVENT |

---

## 9. How to Enroll a Fingerprint (User ID + Finger Index)

This walks through the exact command sequence to enroll a fingerprint for a given **user PIN** and **finger index (0–9)**, based strictly on the commands documented above.

### Step-by-step sequence

**1. Connect and authenticate**
- Send `CMD_CONNECT` (1000). Store the `SessionID` the device returns.
- If the device responds `CMD_ACK_UNAUTH` (2005), send `CMD_AUTH` (1102) with the configured connection password, then retry.

**2. Make sure the user already exists**
- Enrollment via `CMD_STARTENROLL` registers a *fingerprint* against a user — per the manual, the precondition documented for `CMD_USERTEMP_WRQ` is that **the user must already exist** and the target finger slot must be empty. So before enrolling a new finger, confirm/create the user first with `CMD_USER_WRQ` (8), populating a `TUser` record with at least the `PIN` you're going to use (and `Name`, `Privillege`, etc. as needed).
- If you're re-enrolling an existing finger slot, delete the old template first with `CMD_DELETE_USERTEMP` (19): data part = `[PIN (2 bytes)][FingerIndex (1 byte)]`.

**3. Cancel any pending capture state**
- Send `CMD_CANCELCAPTURE` (62). The manual explicitly notes: *"in the setting before the starting registration, cannot enter the registration until transmit the CMD_CANCELCAPTURE order."* This returns the device to the waiting/idle command state before you request enrollment.

**4. Start enrollment for the specific user + finger index**
- Send `CMD_STARTENROLL` (61) with the data part laid out as:
  - Bytes 1–2: user serial number (`PIN`, 2 bytes)
  - Bytes 3–4: fingerprint serial number / finger index (0–9)
- On success, the device's LCD prompts the user to press their finger, and the device enters registration mode for that PIN + finger slot.
- The device will typically require **multiple finger presses** (the manual doesn't state the exact count, but ZK-family devices conventionally take 3 presses per enrollment) before it finalizes a usable template. Watch for `EF_ENROLLFINGER` / `EF_ENROLLUSER` real-time events (see below) or repeated `CMD_ACK_OK` responses to track progress if you've registered for events.

**5. (Optional but recommended) Subscribe to real-time events first**
- Before step 4, you can send `CMD_REG_EVENT` (500) with a bitmask including `EF_ENROLLUSER` (1<<2) and `EF_ENROLLFINGER` (1<<3) so the device pushes progress/completion notifications to your connection as the user presses their finger. Acknowledge each event packet the device sends.

**6. Confirm completion and retrieve/verify the template (optional)**
- Once enrollment succeeds, you can read back the stored template with `CMD_USERTEMP_RRQ` (9): data part = `[PIN (2 bytes)][FingerIndex (1 byte)]` (+ a data-type byte), which returns the `TTemplate` structure for that user/finger.
- Alternatively, confirm existence with `CMD_TEST_TEMP` (1011): send a template to check, and if it matches, the device returns `CMD_ACK_OK` with the user's serial number.

**7. Return the device to normal operation**
- Send `CMD_STARTVERIFY` (60) with no user serial number in the data part — this restores the device to its normal (any-user) verification state, per the manual's note under `CMD_STARTENROLL`.

**8. Disconnect (if done)**
- Send `CMD_EXIT` (1001) to close the session cleanly.

### Summary command order

```
CMD_CONNECT
  └─ (if CMD_ACK_UNAUTH) CMD_AUTH
CMD_USER_WRQ            // ensure user PIN exists (skip if already created)
CMD_REG_EVENT           // optional: subscribe to EF_ENROLLUSER / EF_ENROLLFINGER
CMD_CANCELCAPTURE       // required before entering registration
CMD_STARTENROLL         // data: [PIN (2B)][FingerIndex (2B)]
  ... device prompts user to press finger (multiple times) ...
  ... optional: EF_ENROLLFINGER / EF_ENROLLUSER events arrive ...
CMD_USERTEMP_RRQ        // optional: read back template to confirm
CMD_STARTVERIFY         // no PIN in data part -> restore normal verification mode
CMD_EXIT
```

### Data layout for `CMD_STARTENROLL`

| Bytes | Field |
|---|---|
| 1–2 | User PIN (`U16`) |
| 3–4 | Finger index (0–9) |

### Notes / gotchas from the manual

- The user **must exist** before you enroll a fingerprint template for them (documented precondition under `CMD_USERTEMP_WRQ`; applies to enrollment generally since the fingerprint template is tied to a `PIN`).
- The target finger **slot must be empty** — delete any existing template at that finger index first (`CMD_DELETE_USERTEMP`) if you're re-enrolling.
- You must send `CMD_CANCELCAPTURE` before `CMD_STARTENROLL`, or the device won't enter registration mode.
- After enrollment (or any time you want to leave a special mode), call `CMD_STARTVERIFY` with an empty data part to return to normal idle/verification state.
- Finger index range is 0–9 (a user can have up to 10 enrolled fingerprints).
