''' Module to handle database lines (train numbers) '''


import sys
import traceback
import datetime
import logging


from cab.dbaccess import database
from cab.dbaccess import db_queries


logger = logging.getLogger(__name__)


class TrainNumber():
    ''' Class to hold a train number (line) '''

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

        self.trainnumber = dict()

    def makeDict(self):
        ''' Make the dictionnary (fill in with content) '''
        self.trainnumber['trainNumberId'] = self.tn_id
        self.trainnumber['trainNumberShortName'] = self.tr_sn
        self.trainnumber['lineId'] = self.line_id
        self.trainnumber['circulationId'] = self.circ_id
        self.trainnumber['fromDate'] = self.convertDbDate(self.from_date)
        self.trainnumber['toDate'] = self.convertDbDate(self.to_date)
        
        return self.trainnumber
    
    def convertDbDate(self, dbdate):
        ''' Converts a dbdate from db-format into unix epoch time '''
        year = (dbdate >> 9)
        month = ((dbdate >> 5) & 0xF)
        day = (dbdate & 0x1F)
        myDateTime = datetime.datetime(year, month, day)
        #print(year, month, day, myDateTime.timestamp());
        return int(myDateTime.timestamp())


class DbTrainNumber():
    ''' Class to handle database train numbers (lines) '''

    def __init__(self, db_conn):
        '''
        Constructor
        db_conn: database connection object (sqlite3)
        '''
        self.db_conn = db_conn
        self.trainnumbers = []

    def getTrainNumbers(self):
        '''
        Get lines.
        '''
        #print("getLines: ")

        cursor = self.db_conn.execute(db_queries.QUERY_TRAINNUMBERS)
        for row in cursor:
            #print("getLines: row={0}".format(row))
            
            trainnumber = TrainNumber(
                row[0],    # train number id 
                row[2],    # trainnumber shortname
                row[1],    # line id
                row[3],    # circulation id
                row[9],    # from date
                row[10]    # to date
                )
            self.trainnumbers.append(trainnumber.makeDict())


def getTrainNumbers(dbfile):
    '''
    Retrieve all train numbers (lines) from the given database.
    return train numbers (lines) as json
    '''
    #print("getTrainNumbers: ", dbfile)
    try:
        # open connection to database
        my_database = database.Database(dbfile)
        my_trainnumbers = DbTrainNumber(my_database.db_conn)
        my_trainnumbers.getTrainNumbers()
        #print(my_trainnumbers)
        my_database.close()
        return my_trainnumbers.trainnumbers

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
