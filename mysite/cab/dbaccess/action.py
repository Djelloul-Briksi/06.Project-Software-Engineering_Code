''' Module to handle line (train number) actions '''


import sys
import traceback
import datetime
import logging


from cab.dbaccess import database
from cab.dbaccess import db_queries


logger = logging.getLogger(__name__)


class Action():
    ''' Class to hold an action '''

    def __init__(self, act_id, act_det_id, act_tp, med_tp):
        '''
        Constructor
        act_id: action id (database: action.ActionID)
        act_det_id: action detail id (database: action.ActionDetailID)
        act_tp: action type (database: action.ActionTypeID -> key to actiontype.ActionTypeID -> actiontype.ShortName)
        med_tp: media type (database: action.MediaTypeID -> mediatype.MediaTypeID -> mediatype.ShortName)
        '''
        self.act_id = act_id
        self.act_det_id = act_det_id
        self.act_tp = act_tp
        self.med_tp = med_tp

        self.action = dict()

    def makeDict(self):
        ''' Make the action dictionary (fill in content) '''
        self.action['childType'] = 'action'
        self.action['actionId'] = self.act_id
        self.action['actionDetailId'] = self.act_det_id
        self.action['actionType'] = self.act_tp
        self.action['mediaType'] = self.med_tp
        
        return self.action


class LineEvent():
    ''' Class to hold a line section event '''

    def __init__(self, ev_id, ac_lst, trg_nm):
        '''
        Constructor
        ev_id: event id (database: lineevent.LineEventID)
        ac_lst: action list id (database: lineevent.ActionListID -> key to action.ActionListID)
        trg_nm: trigger name (database: lineevent.EventTriggerID -> key to eventtrigger.EventTriggerID -> eventtrigger.ShortName)
        '''
        self.ev_id = ev_id
        self.ac_lst = ac_lst
        self.trg_nm = trg_nm
        
        self.actions = []
        self.lineevent = dict()

    def makeDict(self):
        ''' Make the event dictionary (fill in content) '''
        self.lineevent['childType'] = 'lineEvent'
        self.lineevent['eventId'] = self.ev_id
        self.lineevent['actionListId'] = self.ac_lst
        self.lineevent['trigger'] = self.trg_nm
        self.lineevent['children'] = []

        for act in self.actions:
            self.lineevent['children'].append(act.makeDict())
        
        return self.lineevent


class LineSection():
    ''' Class to hold a line section '''

    def __init__(self, ls_id, from_st, from_st_abbr, to_st, to_st_abbr, ls_tp):
        '''
        Constructor
        ls_id: line section id (database: linesection.LineSectionID)
        from_st: from station id (database: linesection.FromStationID -> key to station.StationID)
        to_st: from station id (database: linesection.ToStationID -> key to station.StationID)
        ls_tp: line section type id (database: linesection.LineSectionTypeID)
        '''
        self.ls_id = ls_id
        self.from_st = from_st
        self.to_st = to_st
        self.from_st_abbr = from_st_abbr
        self.ls_tp = ls_tp
        self.to_st_abbr = to_st_abbr

        self.events = []
        self.linesection = dict()

    def makeDict(self):
        ''' Make the line section dictionary (fill in content) '''
        self.linesection['childType'] = 'lineSection'
        self.linesection['lineSectionId'] = self.ls_id
        self.linesection['fromStation'] = self.from_st
        self.linesection['fromStationAbbr'] = self.from_st_abbr
        self.linesection['toStation'] = self.to_st
        self.linesection['toStationAbbr'] = self.to_st_abbr
        self.linesection['lineSectionType'] = self.ls_tp
        self.linesection['children'] = []

        for le in self.events:
            self.linesection['children'].append(le.makeDict())
        
        return self.linesection


class Line():
    ''' Class to hold a line (train number) '''

    def __init__(self, tn_id, tr_sn, line_id, circ_id, from_date, to_date):
        '''
        Constructor
        tn_id: train number id (database: trainnumber.TrainNumberID)
        tr_sn: train number short name (database: trainnumber.ShortName)
        line_id: line id (database: trainnumber.LineID -> key to line.LineID)
        circ_id: circulation id (database: trainnumber.CirculationID -> key to circulation.ID)
        from_date: from date, in db-format(database: trainnumber.ValidCycleListID -> key to validcycle.ValidCycleListID -> key to validcycle.FromDateDate)
        to_date: to date, in db-format(database: trainnumber.ValidCycleListID -> key to validcycle.ValidCycleListID -> key to validcycle.UntilDateDate)
        '''
        self.tn_id = tn_id
        self.tr_sn = tr_sn
        self.line_id = line_id
        self.circ_id = circ_id
        self.from_date = from_date
        self.to_date = to_date

        self.line_sections = []
        self.line = dict()

    def makeDict(self):
        ''' Make the line dictionnary (fill in content) '''
        self.line['childType'] = 'trainNumber'
        self.line['trainNumberId'] = self.tn_id
        self.line['trainNumberShortName'] = self.tr_sn
        self.line['lineId'] = self.line_id
        self.line['circulationId'] = self.circ_id
        self.line['fromDate'] = self.convertDbDate(self.from_date)
        self.line['toDate'] = self.convertDbDate(self.to_date)
        self.line['children'] = []

        for ls in self.line_sections:
            self.line['children'].append(ls.makeDict())
        
        return self.line
    

    def convertDbDate(self, dbdate):
        ''' Converts a dbdate from db-format into unix epoch time '''
        year = (dbdate >> 9)
        month = ((dbdate >> 5) & 0xF)
        day = (dbdate & 0x1F)
        myDateTime = datetime.datetime(year, month, day)
        #print(year, month, day, myDateTime.timestamp());
        return int(myDateTime.timestamp())


class DbAction():
    ''' Class to handle train number (line) actions (with line sections, triggers, etc) '''

    def __init__(self, db_conn, trainNumberId):
        '''
        Constructor
        db_conn: database connection object (sqlite3)
        trainNumberId: train number id (line)
        '''
        self.db_conn = db_conn
        self.trainNumberId = trainNumberId
        self.my_line = None

    def getActions(self):
        '''
        Get actions (with line sections, triggers, etc)
        '''
        #print("getActions: ")

        cursor = self.db_conn.execute(str(db_queries.QUERY_TRAINNUMBER_ID).format(self.trainNumberId))
        for row in cursor:
            #print("TrainNumber: row={0}".format(row))
            self.my_line = Line(
                self.trainNumberId, 
                row[1],   # trainnumber shortname
                row[0],   # line id
                row[2],   # circulation id
                row[8],   # from date
                row[9]    # to date
                )
            
            cursor2 = self.db_conn.execute(str(db_queries.QUERY_LINESECTIONS).format(row[0]))
            for row2 in cursor2:
                #print("LineSections: row={0}".format(row2))
                lineSection = LineSection(
                    row2[0],   # line section id
                    row2[2],   # from station shortname
                    row2[3],   # from station abbreviation
                    row2[5],   # to station shortname
                    row2[6],   # to station abbreviation
                    row2[7]
                    )
                
                cursor3 = self.db_conn.execute(str(db_queries.QUERY_LINEEVENTS).format(row2[0]))
                for row3 in cursor3:
                    #print("LineEvents: row={0}".format(row3))
                    lineevent = LineEvent(
                        row3[0],   # line event id
                        row3[1],   # action list id
                        row3[3]    # trigger
                    )

                    cursor4 = self.db_conn.execute(str(db_queries.QUERY_ACTIONS).format(row3[1]))
                    for row4 in cursor4:
                        #print("Actions: row={0}".format(row4))
                        action = Action(
                            row4[0],   # action id
                            row4[1],   # action detail id
                            row4[2],   # action type
                            row4[3]    # media type
                        )
                        lineevent.actions.append(action)

                    lineSection.events.append(lineevent)

                self.my_line.line_sections.append(lineSection)

    
    def makeActionsDict(self):
        return self.my_line.makeDict()


def getActions(dbfile, trainNumberId):
    '''
    Retrieve all actions (with line sections, triggers, etc) of the given train number (line) from the given database.
    dbfile: database file
    trainNumberId: train number id
    return actions as json
    '''
    try:
        my_database = database.Database(dbfile)
        db_action = DbAction(my_database.db_conn, trainNumberId)
        db_action.getActions()
        actions = db_action.makeActionsDict()
        #print(actions)
        my_database.close()
        return actions

    except database.DatabaseException as e:
        logger.error("Programm ended with a database error:{}".format(str(e)))
        return {"exception":"{}".format(str(e))}

    except:
        logger.error("Programm ended with unknown error: see message below")
        exception_type, exception_value, exception_traceback = sys.exc_info()
        logger.error("Exception Type: {}, Exception Value: {}".format(exception_type, exception_value))
        file_name, line_number, procedure_name, line_code = traceback.extract_tb(exception_traceback)[-1]
        logger.error("File Name: {}, Line Number: {}, Procedure Name: {}, Line Code: {}".format(file_name, line_number, procedure_name, line_code))
        return {"exception":"{}".format(str(exception_value))}
    