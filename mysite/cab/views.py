from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.http import JsonResponse
from django.urls import reverse
import logging
import tempfile
import json


from cab.dbaccess import trainnumber as tn
from cab.dbaccess import action as act
from cab.dbaccess import cplxaction as cplx


logger = logging.getLogger(__name__)


# Create your views here.

def index(request):
    ''' The default home (index) page '''
    return HttpResponse("Hello. You're at the CAB index.")

def cab(request):
    ''' the main page of the Complex Action Browser '''
    template = loader.get_template("cab.html")
    logger.debug("--------------------- starting cab.html")
    return HttpResponse(template.render())

def cplxaction(request):
    ''' the page to show a Complex Action Browser Tree '''
    template = loader.get_template("cplxaction.html")
    return HttpResponse(template.render())

def uploaddb(request):
    ''' open and read the database uploaded in the request '''
    if request.method == 'POST':
        # Retrieve the database file name
        dbfile = request.FILES["dbfile"]
        #print(dbfile)

        # save the file (chunks) in a temporary file
        tmp_dbfile = tempfile.NamedTemporaryFile(delete=False)
        request.session['dbfile'] = tmp_dbfile.name
        #print(tmp_dbfile.name)
        logger.info("db saved into {}".format(tmp_dbfile.name))
        for chunk in dbfile.chunks():
            tmp_dbfile.write(chunk)

        # retrieve all train numbers (lines) from the given database
        response_data = tn.getTrainNumbers(request.session['dbfile'])
        logger.info("train numbers: {}".format(response_data))
        #print(response_data)

        # Send train numbers (as JSON) back
        return JsonResponse(json.dumps(response_data), safe=False)

def getactions(request):
    ''' get actions of the train number id contained in the request '''
    if request.method == 'POST':
        # Parse the JSON data from the request body
        data = json.loads(request.body)

        trainNumberId = data["trainNumberId"]
        #print(trainNumberId)

        response_data = act.getActions(request.session['dbfile'], trainNumberId)
        logger.info("actions for trainNumberId {}: {}".format(trainNumberId, response_data))
        
        # Send actions (as JSON) back
        return JsonResponse(json.dumps(response_data), safe=False)
    
def loadcplxaction(request):
    if request.method == 'POST':

        # redirect to complex action page
        response_data = {
                "new_tab": reverse('cplxaction')
            }
        
        return JsonResponse(json.dumps(response_data), safe=False)
    
def getcplxaction(request):
    ''' get the actions tree of the complex action contained in the request '''
    if request.method == 'POST':
        # Parse the JSON data from the request body
        data = json.loads(request.body)

        actionId = data["actionId"]
        actionListId = data["actionListId"]
        actionDetailId = data["actionDetailId"]
        actionType = data["actionType"]
        mediaType = data["mediaType"]

        response_data = cplx.getCplxActionTree(request.session['dbfile'], 
                                               actionId, 
                                               actionListId,
                                               actionDetailId,
                                               actionType,
                                               mediaType)
        
        logger.info("complex actions for actionId {}: {}".format(actionId, response_data))
        
        # Send actions (as JSON) back
        return JsonResponse(json.dumps(response_data), safe=False)